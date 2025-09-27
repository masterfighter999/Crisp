'use client';
import { useState } from 'react';
import { useInterviewStore } from '@/lib/store';
import { CandidateList } from './candidate-list';
import { CandidateDetail } from './candidate-detail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';

export function InterviewerView() {
  const { candidates } = useInterviewStore();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const completedCandidates = candidates.filter(
    (c) => c.interview.status === 'COMPLETED'
  );

  const selectedCandidate = completedCandidates.find(
    (c) => c.id === selectedCandidateId
  );

  if (completedCandidates.length === 0) {
      return (
        <Card className="w-full max-w-2xl mx-auto mt-8 text-center border-dashed">
            <CardHeader>
                <div className="mx-auto bg-muted p-3 rounded-full mb-4">
                    <Users className="size-10 text-muted-foreground" />
                </div>
                <CardTitle>No Completed Interviews</CardTitle>
                <CardDescription>
                    As candidates complete their interviews, they will appear here.
                </CardDescription>
            </CardHeader>
        </Card>
      );
  }

  return (
    <div className="mt-8">
      {selectedCandidate ? (
        <CandidateDetail
          candidate={selectedCandidate}
          onBack={() => setSelectedCandidateId(null)}
        />
      ) : (
        <CandidateList
          candidates={completedCandidates}
          onSelectCandidate={setSelectedCandidateId}
        />
      )}
    </div>
  );
}
