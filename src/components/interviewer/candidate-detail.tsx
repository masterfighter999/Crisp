'use client';
import type { Candidate, ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, User, FileText, Bot } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface CandidateDetailProps {
  candidate: Candidate;
  onBack: () => void;
}

export function CandidateDetail({ candidate, onBack }: CandidateDetailProps) {
    
  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Candidate List
      </Button>

      <Card>
        <CardHeader>
          <div className='flex justify-between items-start'>
            <div>
              <CardTitle className="text-2xl">{candidate.name}</CardTitle>
              <CardDescription>Interview Details</CardDescription>
            </div>
            <Badge variant={getScoreBadgeVariant(candidate.interview.score)} className="text-lg">
                Score: {candidate.interview.score}/100
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span>{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{candidate.phone}</span>
                </div>
                 {candidate.resumeFile && (
                    <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="truncate">{candidate.resumeFile.name}</span>
                    </div>
                )}
            </div>

            <Separator />

            <div>
                <h3 className="font-semibold text-lg mb-2">AI Performance Summary</h3>
                <p className="text-muted-foreground leading-relaxed">{candidate.interview.summary}</p>
            </div>
            
            <Separator />

             <div>
                <h3 className="font-semibold text-lg mb-4">Interview Transcript</h3>
                <div className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg h-96">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-6">
                            {candidate.interview.chatHistory.map((message, index) => (
                                <ChatMessageItem key={index} message={message} />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}


function ChatMessageItem({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user';
    const isQuestion = !isUser && (message.content.includes('?') || message.content.startsWith('Generate a '));

    return (
        <div className={cn('flex items-start gap-3', isUser && 'justify-end')}>
            {!isUser && (
                <Avatar className='size-8'>
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="size-5" /></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                'max-w-xl p-3 rounded-lg text-sm whitespace-pre-wrap', 
                isUser ? 'bg-primary/10 dark:bg-primary/20 rounded-br-none' : 'bg-background rounded-bl-none',
                isQuestion && 'font-medium'
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
