// src/components/auth/with-auth.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useInterviewStore } from '@/lib/store';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const Wrapper = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const activeToken = useInterviewStore(s => s.activeToken);

    useEffect(() => {
      if (loading) return;
      
      const isInterviewerRoute = pathname.startsWith('/dashboard');
      const isCandidateRoute = pathname.startsWith('/interview');
      
      if (!user) {
        // If no user, redirect to appropriate login
        if(isInterviewerRoute) router.push('/login');
        else router.push('/'); // Assumes homepage is candidate token entry
      } else {
        const isAnonymous = user.isAnonymous;
        // If user is anonymous, they should not access interviewer dashboard
        if(isAnonymous && isInterviewerRoute) {
            router.push('/');
        }
        // If user is not anonymous, they should not access anonymous interview flow
        if(!isAnonymous && isCandidateRoute) {
            router.push('/dashboard');
        }
        // If user is anonymous but has no token for the interview page
        if(isAnonymous && isCandidateRoute && !activeToken) {
          router.push('/');
        }
      }
    }, [user, loading, router, pathname, activeToken]);

    if (loading || !user) {
       return (
       <div className="flex flex-col min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
           <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;
