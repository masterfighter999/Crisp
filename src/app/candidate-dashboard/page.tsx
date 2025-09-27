// src/app/candidate-dashboard/page.tsx
'use client';
import { Header } from '@/components/header';
import { ClientOnly } from '@/components/client-only';
import withAuth from '@/components/auth/with-auth';
import { useAuth } from '@/context/auth-context';
import { useInterviewStore } from '@/lib/store';
import type { Candidate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookUser } from 'lucide-react';
import { format } from 'date-fns';

function CandidateDashboardPage() {
  const { user } = useAuth();
  const { candidates } = useInterviewStore();

  const completedInterviews = candidates.filter(c => c.email === user?.email && c.interview.status === 'COMPLETED');

  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ClientOnly>
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Your Dashboard</h1>
            {completedInterviews.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedInterviews.map(interview => (
                  <Card key={interview.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle>Interview Result</CardTitle>
                        <Badge variant={getScoreBadgeVariant(interview.interview.score)} className="text-base">
                          {interview.interview.score}/100
                        </Badge>
                      </div>
                      <CardDescription>
                        {interview.interview.endTime ? format(new Date(interview.interview.endTime), 'PPP') : 'Date not available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-4">{interview.interview.summary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
               <Card className="w-full text-center border-dashed mt-12">
                  <CardHeader>
                      <div className="mx-auto bg-muted p-3 rounded-full mb-4">
                          <BookUser className="size-10 text-muted-foreground" />
                      </div>
                      <CardTitle>No Completed Interviews</CardTitle>
                      <CardDescription>
                          Your past interview results will appear here.
                      </CardDescription>
                  </CardHeader>
              </Card>
            )}
          </div>
        </ClientOnly>
      </main>
    </div>
  );
}

export default withAuth(CandidateDashboardPage);
