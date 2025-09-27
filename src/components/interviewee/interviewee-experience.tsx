'use client';

import { useInterviewStore } from '@/lib/store';
import { Onboarding } from './onboarding';
import { ChatInterface } from './chat-interface';
import { WelcomeBackModal } from './welcome-back-modal';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, PartyPopper } from 'lucide-react';

export function IntervieweeExperience() {
  const {
    activeCandidateId,
    getActiveCandidate,
    resetActiveCandidate,
    setInterviewStatus,
    startOver,
  } = useInterviewStore();
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const activeCandidate = getActiveCandidate();
  
  useEffect(() => {
    if (activeCandidate?.interview.status === 'IN_PROGRESS') {
      setShowWelcomeModal(true);
    }
  }, [activeCandidate?.id, activeCandidate?.interview.status]);
  
  const handleStartOver = () => {
    if (activeCandidateId) {
      startOver(activeCandidateId);
    }
    setShowWelcomeModal(false);
  }
  
  const handleResume = () => {
    setShowWelcomeModal(false);
  }

  if (!activeCandidate) {
    return <Onboarding />;
  }

  if (activeCandidate.interview.status === 'COMPLETED') {
    return (
       <Card className="w-full max-w-2xl mx-auto mt-8 text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900/20 p-3 rounded-full mb-4">
             <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Interview Complete!</CardTitle>
          <CardDescription>
            Thank you for your time. The hiring team will be in touch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">Your Performance Summary</h3>
              <p className="text-muted-foreground text-sm">Score: <span className="font-bold text-foreground">{activeCandidate.interview.score}/100</span></p>
              <p className="text-muted-foreground text-sm leading-relaxed">{activeCandidate.interview.summary}</p>
          </div>
          <Button onClick={resetActiveCandidate} className="mt-6">
            Start New Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (
    activeCandidate.interview.status === 'COLLECTING_INFO' ||
    activeCandidate.interview.status === 'READY_TO_START'
  ) {
    return <Onboarding />;
  }
  
  if (activeCandidate.interview.status === 'IN_PROGRESS') {
    return (
      <>
        <WelcomeBackModal 
          isOpen={showWelcomeModal}
          onClose={handleResume}
          onStartOver={handleStartOver}
        />
        <ChatInterface />
      </>
    );
  }


  return null;
}
