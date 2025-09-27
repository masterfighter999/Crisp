'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

import { Logo } from './logo';
import { Button } from './ui/button';
import { SignupModal } from './auth/signup-modal';
import { LogOut, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { User, ShieldCheck } from 'lucide-react';
import { useInterviewStore } from '@/lib/store';

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSignupModalOpen, setSignupModalOpen] = useState(false);
  const resetActiveCandidate = useInterviewStore(s => s.resetActiveCandidate);

  const handleSignOut = async () => {
    await signOut(auth);
    resetActiveCandidate();
    router.push(pathname.startsWith('/dashboard') || pathname.startsWith('/login') ? '/login' : '/');
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return <User className="size-4" />;
    return email.substring(0, 2).toUpperCase();
  };


  return (
    <>
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setSignupModalOpen(false)} />
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Logo />
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                AI Interview Ace
              </h1>
            </Link>

            <div className="flex items-center gap-2">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                       <Avatar className="h-8 w-8">
                         <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                       </Avatar>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none flex items-center">
                           {user.isAnonymous ? 'Candidate' : 'Interviewer'}
                           {!user.isAnonymous && <ShieldCheck className="ml-2 size-4 text-primary" />}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email || 'guest'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {!user.isAnonymous && (
                      <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                       <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                 !pathname.startsWith('/login') && (
                    <>
                      <Button variant="ghost" onClick={() => router.push('/login')}>
                        Interviewer Login
                      </Button>
                      <Button onClick={() => setSignupModalOpen(true)}>Sign Up</Button>
                    </>
                 )
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
