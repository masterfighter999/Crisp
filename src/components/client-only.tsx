'use client';
import { useInterviewStore } from '@/lib/store';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const hydrated = useInterviewStore((state) => state.hydrated);

  useEffect(() => {
    useInterviewStore.persist.rehydrate();
  }, []);

  if (!hydrated) {
    return (
      <div className="space-y-4 p-4 mt-8">
        <Skeleton className="h-10 w-1/2 mx-auto" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
