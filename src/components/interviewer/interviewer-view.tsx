'use client';
import { useState, useMemo } from 'react';
import { useInterviewStore } from '@/lib/store';
import { CandidateList } from './candidate-list';
import { CandidateDetail } from './candidate-detail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users } from 'lucide-react';
import { AddCandidate } from './add-candidate';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export function InterviewerView() {
  const { user } = useAuth();
  const { candidates, deleteCandidate } = useInterviewStore();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const { toast } = useToast();

  const getCompanyDomain = () => {
      if (!user || !user.email) return null;
      if (user.email === 'swayam.internship@gmail.com') return 'admin';
      return user.email.substring(user.email.lastIndexOf('@') + 1);
  }

  const completedCandidates = useMemo(() => {
    const companyDomain = getCompanyDomain();
    if (!companyDomain) return [];
    
    // Admins see all candidates, others see only their company's candidates
    return candidates.filter(c => 
      c.interview.status === 'COMPLETED' && 
      (companyDomain === 'admin' || c.companyDomain === companyDomain)
    );
  }, [candidates, user]);


  const selectedCandidate = completedCandidates.find(
    (c) => c.id === selectedCandidateId
  );
  
  const handleDeleteCandidate = async (id: string) => {
    await deleteCandidate(id);
    setSelectedCandidateId(null);
    toast({
        title: "Candidate Deleted",
        description: "The candidate's data has been removed.",
    });
  }

  const handleDeleteSelected = (ids: string[]) => {
    setIdsToDelete(ids);
    setShowDeleteConfirm(true);
  }

  const confirmDeleteSelected = async () => {
    const deletePromises = idsToDelete.map(id => deleteCandidate(id));
    await Promise.all(deletePromises);
    toast({
      title: `${idsToDelete.length} candidate(s) deleted.`,
      description: "The selected candidates have been removed."
    });
    setShowDeleteConfirm(false);
    setIdsToDelete([]);
  }

  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all data for {idsToDelete.length} selected candidate(s). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteSelected}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      <div className="mt-8 space-y-8">
        <AddCandidate />
        {completedCandidates.length === 0 ? (
          <Card className="w-full text-center border-dashed">
              <CardHeader>
                  <div className="mx-auto bg-muted p-3 rounded-full mb-4">
                      <Users className="size-10 text-muted-foreground" />
                  </div>
                  <CardTitle>No Completed Interviews</CardTitle>
                  <CardDescription>
                      As candidates complete their interviews for your organization, they will appear here.
                  </CardDescription>
              </CardHeader>
          </Card>
        ) : selectedCandidate ? (
          <CandidateDetail
            candidate={selectedCandidate}
            onBack={() => setSelectedCandidateId(null)}
            onDelete={handleDeleteCandidate}
          />
        ) : (
          <CandidateList
            candidates={completedCandidates}
            onSelectCandidate={setSelectedCandidateId}
            onDeleteSelected={handleDeleteSelected}
          />
        )}
      </div>
    </>
  );
}