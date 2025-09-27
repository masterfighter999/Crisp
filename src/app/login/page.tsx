// src/app/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllowedDomains = async () => {
        try {
            const domainsSnapshot = await getDocs(collection(firestore, 'allowedDomains'));
            const domains = domainsSnapshot.docs.map(doc => doc.data().domain);
            setAllowedDomains(domains);
        } catch (error) {
            console.error("Failed to fetch allowed domains:", error);
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: 'Could not load interviewer domains. Please contact an admin.',
            });
        }
    };
    fetchAllowedDomains();
  }, [toast]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    const userEmail = values.email.toLowerCase();
    const userDomain = userEmail.substring(userEmail.lastIndexOf('@') + 1);

    const isAllowedDomain = allowedDomains.includes(userDomain);
    const isAdminEmail = userEmail === 'swayam.internship@gmail.com';

    if (!isAllowedDomain && !isAdminEmail) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized Domain',
        description: 'This email address is not authorized for interviewer access.',
      });
      setIsLoading(false);
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'Please check your credentials and try again.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Interviewer Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@interviewer.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Log In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
