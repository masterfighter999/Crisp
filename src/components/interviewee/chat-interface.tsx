
'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useInterviewStore, INTERVIEW_SCHEDULE } from '@/lib/store';
import { getInterviewSummary, getInterviewQuestion } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/lib/types';

export function ChatInterface() {
  const {
    getActiveCandidate,
    submitAnswer,
    addAiChatMessage,
    addUserChatMessage,
    addQuestion,
    completeInterview,
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


  const sendNextQuestion = async () => {
    if (!candidate || !scheduleItem) return;

    setIsLoading(true);
    setQuestionError(false);

    try {
      const newQuestion = await getInterviewQuestion({
        difficulty: scheduleItem.difficulty,
        topic: 'full stack',
      });
      await addQuestion(candidate.id, newQuestion);
      await addAiChatMessage(candidate.id, newQuestion.question);
      setUserAnswer('');
    } catch (error: any) {
      setQuestionError(true);
      toast({
        variant: 'destructive',
        title: 'Failed to generate question.',
        description: "Please click 'Next Question' to try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!candidate || !currentQuestion || isLoading || questionError) return;

    const answerToSubmit = userAnswer.trim() || "Time's up! No answer provided.";
    
    await addUserChatMessage(candidate.id, answerToSubmit);
    await submitAnswer(candidate.id, answerToSubmit);
    // The state change will trigger the useEffect below to fetch the next question.
  };

  // Effect to fetch the next question
  useEffect(() => {
    if (candidate?.interview.status === 'IN_PROGRESS') {
      const answersCount = candidate.interview.answers.length;
      const questionsCount = candidate.interview.questions.length;

      // If we have an answer for every question we have, it's time to get a new one.
      if (answersCount === questionsCount && questionsCount < INTERVIEW_SCHEDULE.length) {
          sendNextQuestion();
      } else if (questionsCount === 0 && answersCount === 0) {
        // Initial question fetch
        sendNextQuestion();
      }
    }
  }, [candidate?.id, candidate?.interview.answers.length]);


  // Effect to start timer when a new question is ready
  useEffect(() => {
    // A new question is ready if it exists and we haven't answered it yet.
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
    
    // Cleanup timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestion, hasAnsweredCurrent, isLoading, candidate?.id]);
  
  const finalizeInterview = async () => {
    if (!candidate || candidate.interview.status === 'COMPLETED') return;
    
    setIsLoading(true); // Show a finalizing message
    
    // Check if the finalization message is already there
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
  };
  
  // Effect to finalize the interview when all questions are answered
  useEffect(() => {
    if (candidate?.interview.status === 'IN_PROGRESS' && candidate.interview.answers.length === INTERVIEW_SCHEDULE.length) {
      finalizeInterview();
    }
  }, [candidate?.interview.answers.length]);


  const progressPercentage = scheduleItem ? (timeLeft / scheduleItem.duration) * 100 : 0;
  
  if (!candidate || (candidate.interview.status === 'IN_PROGRESS' && candidate.interview.answers.length === INTERVIEW_SCHEDULE.length)) {
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
            <Progress value={(currentQuestionIndex / INTERVIEW_SCHEDULE.length) * 100} />
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
                 <Button onClick={sendNextQuestion}>Next Question</Button>
              </div>
            )}
            {!isLoading && !questionError && currentQuestion && (
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
                <span className="text-sm text-muted-foreground">Generating question...</span>
            </div>
        </div>
    )
}
