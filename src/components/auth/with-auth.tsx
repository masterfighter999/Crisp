// src/components/auth/with-auth.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useInterviewStore } from '@/lib/store';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';


// In a real application, this should come from a secure config or remote service.
const ADMIN_EMAIL = 'swayam.internship@gmail.com';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const Wrapper = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const activeToken = useInterviewStore(s => s.activeToken);
    const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(true);

    useEffect(() => {
        const fetchAllowedDomains = async () => {
            try {
                const domainsSnapshot = await getDocs(collection(firestore, 'allowedDomains'));
                const domains = domainsSnapshot.docs.map(doc => doc.data().domain);
                setAllowedDomains(domains);
            } catch (error) {
                console.error("Failed to fetch allowed domains:", error);
            } finally {
                setDomainsLoading(false);
            }
        };
        fetchAllowedDomains();
    }, []);

    const isInterviewer = useMemo(() => {
        if (!user || !user.email) return false;
        if (user.email === ADMIN_EMAIL) return true;
        
        const userDomain = user.email.substring(user.email.lastIndexOf('@') + 1);
        return allowedDomains.includes(userDomain);

    }, [user, allowedDomains]);

    useEffect(() => {
      if (loading || domainsLoading) return;
      
      const isInterviewerRoute = pathname.startsWith('/dashboard');
      const isCandidateInterviewRoute = pathname.startsWith('/interview');
      const isCandidateDashboardRoute = pathname.startsWith('/candidate-dashboard');
      const isAdminRoute = pathname.startsWith('/admin/dashboard');
      
      if (!user) {
        // If no user, redirect to appropriate login
        if(isInterviewerRoute) router.push('/login');
        else if(isCandidateDashboardRoute) router.push('/candidate-login');
        else if(isCandidateInterviewRoute) router.push('/');
        else if(isAdminRoute) router.push('/admin/login');
        return;
      }

      // At this point, user is authenticated
      const isAnonymous = user.isAnonymous;
      const isAdmin = user.email === ADMIN_EMAIL;

      // Rule 1: Protect interviewer dashboard
      if (isInterviewerRoute && !isInterviewer) {
        router.push('/'); 
        return;
      }

      // Rule 2: Anonymous users can only access the interview page (with a token)
      if (isAnonymous) {
        if (isInterviewerRoute || isCandidateDashboardRoute || isAdminRoute) {
          router.push('/');
        } else if (isCandidateInterviewRoute && !activeToken) {
          router.push('/');
        }
        return;
      }
      
      // Rule 3: Logged-in (non-anonymous) candidates cannot access the guest interview flow
      if (!isAnonymous && isCandidateInterviewRoute) {
        router.push('/candidate-dashboard');
        return;
      }
      
      // Rule 4: Protect admin dashboard
      if (isAdminRoute && !isAdmin) {
        router.push('/admin/login');
        return;
      }


    }, [user, loading, router, pathname, activeToken, domainsLoading, isInterviewer]);

    if (loading || domainsLoading || !user) {
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
