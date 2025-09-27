// src/components/auth/candidate-auth.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { useInterviewStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

const formSchema = z.object({
  token: z.string().min(1, { message: 'Please enter your interview token.' }),
});

export function CandidateAuth() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { setToken, fetchAllQuestions } = useInterviewStore();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { token: '' },
  });
  
  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
      await fetchAllQuestions();
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Guest Sign-In Failed',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const onTokenSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const tokensCollection = collection(firestore, 'interviewTokens');
      const q = query(
        tokensCollection,
        where('token', '==', values.token),
        where('isValid', '==', true)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Invalid Token',
          description:
            'The token is either incorrect or has already been used.',
        });
      } else {
        await fetchAllQuestions();
        setToken(values.token);
        router.push('/interview');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'Could not validate your token.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  if (user && user.isAnonymous) {
      return (
         <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4">Enter Interview Token</CardTitle>
            <CardDescription>
              You're signed in as a guest. Please enter your unique token to begin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onTokenSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Token</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your token..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Interview
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )
  }


  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <User className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="mt-4">Candidate Access</CardTitle>
        <CardDescription>
          Sign in as a guest to start an interview, or log in to view past results.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
         <Button
          onClick={handleGuestSignIn}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Start as Guest
        </Button>
        <div className="relative flex justify-center w-full text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/candidate-login')}
          disabled={isLoading}
        >
          Login to View Dashboard
        </Button>
      </CardContent>
       <CardFooter className="flex-col gap-4">
         <p className="px-8 text-center text-xs text-muted-foreground">
          Log in to your account to see past interview results.
        </p>
         <p className="px-8 text-center text-xs text-muted-foreground">
          New candidate? <Link href="/signup" className="underline text-primary">Create an account</Link>.
        </p>
       </CardFooter>
    </Card>
  );
}
