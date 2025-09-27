'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useInterviewStore, INTERVIEW_SCHEDULE } from '@/lib/store';
import { getInterviewSummary } from '@/app/actions';
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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

export function ChatInterface() {
  const {
    getActiveCandidate,
    submitAnswer,
    addAiChatMessage,
    addUserChatMessage,
    completeInterview,
  } = useInterviewStore();

  const [isLoading, setIsLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const candidate = getActiveCandidate();

  const currentQuestionIndex = candidate?.interview.currentQuestionIndex ?? 0;
  const currentQuestion = candidate?.interview.questions[currentQuestionIndex];
  const scheduleItem = INTERVIEW_SCHEDULE[currentQuestionIndex];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [candidate?.interview.chatHistory]);


  const sendNextQuestion = async () => {
      if (!candidate) return;
      
      const questionIndex = candidate.interview.currentQuestionIndex;
      const questions = candidate.interview.questions;

      if (questionIndex >= questions.length) {
          finalizeInterview();
          return;
      }
      
      const nextQuestion = questions[questionIndex];
      if (nextQuestion) {
          setIsLoading(true);
          await addAiChatMessage(candidate.id, nextQuestion.question);
          setIsLoading(false);
          // Reset answer state for new question
          setUserAnswer('');
          setSelectedMcqOption(null);
      }
  };
  
  const handleAnswerSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!candidate || !currentQuestion) return;

    let answerToSubmit: string | number;
    let answerForChat: string;

    if (currentQuestion.type === 'mcq') {
        answerToSubmit = selectedMcqOption ?? -1; // -1 for unanswered
        answerForChat = selectedMcqOption !== null ? currentQuestion.options[selectedMcqOption] : "Time's up! No answer provided.";
    } else {
        answerToSubmit = userAnswer.trim() || "Time's up! No answer provided.";
        answerForChat = answerToSubmit;
    }

    await addUserChatMessage(candidate.id, answerForChat);
    await submitAnswer(candidate.id, answerToSubmit);
    // State will refresh via useEffect, triggering next question
  };

  useEffect(() => {
    // This effect now simply sends the next question from the pre-loaded list.
    if (candidate?.interview.status === 'IN_PROGRESS') {
      const hasAnsweredCurrent = candidate.interview.answers.length > currentQuestionIndex;
      if (!hasAnsweredCurrent) {
          // If the current question hasn't been sent to chat yet, send it.
          const currentQuestionInChat = candidate.interview.chatHistory.some(m => m.content === currentQuestion?.question);
          if (currentQuestion && !currentQuestionInChat) {
              sendNextQuestion();
          }
      }
    }
  }, [candidate?.id, currentQuestionIndex, candidate?.interview.answers.length]);


  useEffect(() => {
    if (currentQuestion && scheduleItem && !isLoading && candidate?.interview.answers.length === currentQuestionIndex) {
      const duration = scheduleItem.duration;
      setTimeLeft(duration);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if(timerRef.current) clearInterval(timerRef.current);
            handleAnswerSubmit(); // This will also trigger the next question via state change
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, isLoading, candidate?.interview.answers.length]);
  
  const finalizeInterview = async () => {
    if (!candidate || candidate.interview.status === 'COMPLETED') return;
    setIsLoading(true);
    await addAiChatMessage(candidate.id, 'Thank you for completing the interview. I am now generating your performance summary...');
    
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
  
  const progressPercentage = scheduleItem ? (timeLeft / scheduleItem.duration) * 100 : 0;
  
  if (!candidate || !currentQuestion || !scheduleItem) {
     if (candidate && candidate.interview.status === 'IN_PROGRESS' && currentQuestionIndex >= INTERVIEW_SCHEDULE.length) {
       // This handles the case where the interview is finished but summary is being generated.
        return (
             <Card className="w-full max-w-3xl mx-auto mt-8">
                <CardHeader className="text-center">
                    <CardTitle>Finalizing Your Results</CardTitle>
                    <CardDescription>This may take a moment.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-96">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <p className="text-muted-foreground max-w-md">
                            The AI is analyzing your full interview transcript to generate a detailed performance summary and a final score.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
     }
      return null;
  }

  const isQuestionAnswered = candidate.interview.answers.length > currentQuestionIndex;

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
            <div className="flex items-center gap-4 mb-2">
                <p className="text-sm font-medium">Time remaining: {timeLeft}s</p>
                <Progress value={progressPercentage} className="w-full [&>div]:bg-accent" />
            </div>
            <form onSubmit={(e: FormEvent) => {e.preventDefault(); handleAnswerSubmit()}} className="relative">
                {currentQuestion.type === 'text' && (
                    <Textarea 
                        placeholder="Type your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="pr-20 min-h-[80px]"
                        disabled={isLoading || isQuestionAnswered}
                    />
                )}
                 {currentQuestion.type === 'mcq' && (
                    <RadioGroup 
                        className="space-y-2" 
                        value={selectedMcqOption?.toString()}
                        onValueChange={(val) => setSelectedMcqOption(parseInt(val))}
                        disabled={isLoading || isQuestionAnswered}
                    >
                        {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 rounded-md border p-3">
                                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}

                <Button type="submit" size="icon" className="absolute right-2 bottom-2" disabled={isLoading || isQuestionAnswered}>
                    <Send className="size-4" />
                </Button>
            </form>
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
                <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
        </div>
    )
}
