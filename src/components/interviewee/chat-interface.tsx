
'use client';
import { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { useInterviewStore, INTERVIEW_SCHEDULE } from '@/lib/store';
import { getInterviewSummary, generateQuestionAction } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage, InterviewQuestion } from '@/lib/types';

export function ChatInterface() {
  const {
    getActiveCandidate,
    submitAnswer,
    addAiChatMessage,
    addUserChatMessage,
    addQuestion,
    completeInterview,
    questionBank,
  } = useInterviewStore();

  const [isLoading, setIsLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionError, setQuestionError] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const candidate = getActiveCandidate();

  const currentQuestionIndex = candidate?.interview.currentQuestionIndex ?? 0;
  const currentQuestion = candidate?.interview.questions[currentQuestionIndex];
  const scheduleItem = INTERVIEW_SCHEDULE[currentQuestionIndex];
  const hasAnsweredCurrent = (candidate?.interview.answers.length ?? 0) > currentQuestionIndex;


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [candidate?.interview.chatHistory]);


  const sendNextQuestion = useCallback(async () => {
    if (!candidate || !scheduleItem || isLoading) return;

    // Guard to prevent sending a question if one is already in flight or the logic is ahead.
    if (candidate.interview.questions.length > candidate.interview.answers.length) {
      return;
    }

    setIsLoading(true);
    setQuestionError(false);

    try {
      let newQuestion: InterviewQuestion | null = null;
      const availableQuestions = questionBank.filter(q => q.difficulty === scheduleItem.difficulty && !candidate.interview.questions.some(asked => asked.questionText === q.questionText));

      if (availableQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        newQuestion = availableQuestions[randomIndex];
      } else {
        console.warn(`No questions found in local question bank for difficulty: ${scheduleItem.difficulty}. Falling back to AI generation.`);
        const questionText = await generateQuestionAction({ difficulty: scheduleItem.difficulty, topic: 'full stack' });
        newQuestion = {
            questionText: questionText,
            difficulty: scheduleItem.difficulty,
            type: 'text'
        };
      }

      if (!newQuestion) {
        throw new Error('Failed to select or generate a question.');
      }

      await addQuestion(candidate.id, newQuestion);
      await addAiChatMessage(candidate.id, newQuestion.questionText);
      setUserAnswer('');

    } catch (error: any) {
      console.error(error);
      setQuestionError(true);
      toast({
        variant: 'destructive',
        title: 'Failed to get question.',
        description: "There was an issue loading the next question. Please click 'Retry' to try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [candidate, scheduleItem, questionBank, addQuestion, addAiChatMessage, toast, isLoading]);
  
  const handleAnswerSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!candidate || !currentQuestion || isLoading || questionError || hasAnsweredCurrent) return;

    const answerToSubmit = userAnswer.trim() || "Time's up! No answer provided.";
    
    await addUserChatMessage(candidate.id, answerToSubmit);
    await submitAnswer(candidate.id, answerToSubmit);

  }, [candidate, currentQuestion, isLoading, questionError, userAnswer, addUserChatMessage, submitAnswer, hasAnsweredCurrent]);


  useEffect(() => {
    // This is now the SINGLE source of truth for sending a question.
    // It runs if the interview is in progress, not complete, and we need to send the next question.
    if (
      candidate?.interview.status === 'IN_PROGRESS' &&
      candidate.interview.answers.length < INTERVIEW_SCHEDULE.length &&
      candidate.interview.questions.length === candidate.interview.answers.length
    ) {
      sendNextQuestion();
    }
  }, [candidate?.interview.answers.length, candidate?.interview.questions.length, candidate?.interview.status, sendNextQuestion]);


  useEffect(() => {
    if (currentQuestion && !hasAnsweredCurrent && !isLoading && candidate?.interview.status === 'IN_PROGRESS') {
      const duration = scheduleItem.duration;
      setTimeLeft(duration);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if(timerRef.current) clearInterval(timerRef.current);
            handleAnswerSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, hasAnsweredCurrent, isLoading, candidate?.id, candidate?.interview.status, scheduleItem, handleAnswerSubmit]);
  
  const finalizeInterview = useCallback(async () => {
    if (!candidate || candidate.interview.status === 'COMPLETED') return;
    
    setIsLoading(true);
    
    const finalizingMessage = 'Thank you for completing the interview. I am now generating your performance summary...';
    if (!candidate.interview.chatHistory.some(m => m.content === finalizingMessage)) {
       await addAiChatMessage(candidate.id, finalizingMessage);
    }
    
    const chatHistoryString = candidate.interview.chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
      
    const summaryData = await getInterviewSummary({ chatHistory: chatHistoryString });
    
    if (summaryData) {
      await completeInterview(candidate.id, summaryData.summary, summaryData.finalScore);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not generate interview summary.'
        });
        await completeInterview(candidate.id, 'Error generating summary.', 0);
    }
    setIsLoading(false);
  }, [candidate, addAiChatMessage, completeInterview, toast]);
  
  useEffect(() => {
    if (candidate?.interview.status === 'IN_PROGRESS' && candidate.interview.answers.length === INTERVIEW_SCHEDULE.length && candidate.interview.questions.length === INTERVIEW_SCHEDULE.length) {
      finalizeInterview();
    }
  }, [candidate?.interview.answers.length, candidate?.interview.status, finalizeInterview, candidate?.interview.questions.length]);


  const progressPercentage = scheduleItem ? (timeLeft / scheduleItem.duration) * 100 : 0;
  
  if (!candidate || (candidate.interview.status === 'IN_PROGRESS' && candidate.interview.answers.length === INTERVIEW_SCHEDULE.length && !isLoading)) {
      return (
          <Card className="w-full max-w-3xl mx-auto mt-8">
            <CardHeader className="text-center">
                <CardTitle>Finalizing Your Results</CardTitle>
                <CardDescription>
                  The AI is analyzing your full interview transcript to generate a detailed performance summary and a final score. This may take a moment.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-96">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-muted-foreground max-w-md">
                        Analyzing answers...
                    </p>
                </div>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader className="text-center">
        <CardTitle>Interview in Progress</CardTitle>
        <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-2">
                Question {currentQuestionIndex + 1} of {INTERVIEW_SCHEDULE.length} ({scheduleItem?.difficulty})
            </p>
            <Progress value={((currentQuestionIndex) / INTERVIEW_SCHEDULE.length) * 100} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg h-96 flex flex-col">
            <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
                 <div className="space-y-6">
                    {candidate?.interview.chatHistory.map((message, index) => (
                        <ChatMessageItem key={index} message={message} />
                    ))}
                    {isLoading && <LoadingSpinner />}
                 </div>
            </ScrollArea>
        </div>
        
        <div className="mt-4">
            {questionError && !isLoading && (
              <div className="flex justify-center">
                 <Button onClick={sendNextQuestion}>Retry</Button>
              </div>
            )}
            {!isLoading && !questionError && currentQuestion && !hasAnsweredCurrent && (
              <>
                <div className="flex items-center gap-4 mb-2">
                    <p className="text-sm font-medium">Time remaining: {timeLeft}s</p>
                    <Progress value={progressPercentage} className="w-full [&>div]:bg-accent" />
                </div>
                <form onSubmit={(e: FormEvent) => {e.preventDefault(); handleAnswerSubmit()}} className="relative">
                    <Textarea 
                        placeholder="Type your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="pr-20 min-h-[80px]"
                        disabled={hasAnsweredCurrent}
                    />

                    <Button type="submit" size="icon" className="absolute right-2 bottom-2" disabled={hasAnsweredCurrent}>
                        <Send className="size-4" />
                    </Button>
                </form>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    return (
        <div className={cn('flex items-start gap-3', isUser && 'justify-end')}>
            {!isUser && (
                <Avatar className='size-8'>
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-5" /></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                'max-w-md p-3 rounded-lg text-sm whitespace-pre-wrap', 
                isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none'
            )}>
                {message.content}
            </div>
             {isUser && (
                <Avatar className='size-8'>
                    <AvatarFallback><User className="size-5" /></AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}

function LoadingSpinner() {
    return (
        <div className="flex items-start gap-3">
             <Avatar className='size-8'>
                <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-5" /></AvatarFallback>
            </Avatar>
            <div className="max-w-md p-3 rounded-lg bg-background flex items-center space-x-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Getting question...</span>
            </div>
        </div>
    )
}

    

    

    