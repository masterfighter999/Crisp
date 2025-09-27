'use client';
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

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOver: () => void;
}

export function WelcomeBackModal({ isOpen, onClose, onStartOver }: WelcomeBackModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Welcome Back!</AlertDialogTitle>
          <AlertDialogDescription>
            You have an interview in progress. Would you like to resume where you left off or start over?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStartOver}>Start Over</AlertDialogCancel>
          <AlertDialogAction onClick={onClose}>Resume Interview</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
