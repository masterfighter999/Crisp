// src/components/auth/candidate-auth.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
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
import { Loader2, KeyRound } from 'lucide-react';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  token: z.string().min(1, { message: 'Please enter your interview token.' }),
});

export function CandidateAuth() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { setToken } = useInterviewStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { token: '' },
  });

  const onTokenSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // First, sign in anonymously to be able to query Firestore
      await signInAnonymously(auth);

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
        // Sign out if token is invalid
        await auth.signOut();
      } else {
        setToken(values.token);
        router.push('/interview');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'Could not validate your token.',
      });
      await auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Redirect to a future candidate dashboard
      router.push('/candidate-dashboard');
      toast({
        title: 'Coming Soon!',
        description: 'The candidate dashboard is under construction.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <KeyRound className="mx-auto h-12 w-12 text-primary" />
        <CardTitle className="mt-4">Candidate Access</CardTitle>
        <CardDescription>
          Enter your unique interview token to begin.
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
      <CardFooter className="flex flex-col gap-4">
        <div className="relative flex justify-center w-full text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L381.8 120.2C344.3 87.7 300.6 73 248 73c-94 0-170.8 76.7-170.8 171s76.7 171 170.8 171c98.2 0 150-71.2 155.1-106.3H248v-85.3h236.2c2.3 12.7 3.8 25.8 3.8 39.8z"
              ></path>
            </svg>
          )}
          Sign in with Google
        </Button>
         <p className="px-8 text-center text-xs text-muted-foreground">
          Sign in with Google to view past interview results (feature coming soon).
        </p>
      </CardFooter>
    </Card>
  );
}
