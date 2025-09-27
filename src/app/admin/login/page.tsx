// src/app/admin/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // This is necessary to initialize the reCAPTCHA verifier widget
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handleSendCode = async () => {
    if (!phoneNumber) {
        toast({ variant: 'destructive', title: 'Phone number is required.' });
        return;
    }
    setIsLoading(true);
    try {
      const verifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      toast({ title: 'Verification Code Sent', description: `A code has been sent to ${phoneNumber}.` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Code',
        description: error.message || 'Please check the phone number and try again.',
      });
       // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: any) => {
          grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
     if (!verificationCode) {
        toast({ variant: 'destructive', title: 'Verification code is required.' });
        return;
    }
    if (!confirmationResult) {
         toast({ variant: 'destructive', title: 'Please request a verification code first.' });
        return;
    }
    setIsLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.code === 'auth/invalid-verification-code' 
          ? 'The verification code is invalid. Please try again.'
          : error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4">Admin Login</CardTitle>
            <CardDescription>
                {confirmationResult ? 'Enter the code sent to your phone.' : 'Enter your phone number to sign in.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!confirmationResult ? (
              <div className="space-y-4">
                <Input
                  type="tel"
                  placeholder="e.g., +16505551234"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
                <Button onClick={handleSendCode} className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Verification Code
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isLoading}
                />
                <Button onClick={handleVerifyCode} className="w-full" disabled={isLoading}>
                   {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify and Sign In
                </Button>
                 <Button variant="link" onClick={() => setConfirmationResult(null)} className="w-full">
                    Use a different phone number
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <div id="recaptcha-container"></div>
    </div>
  );
}

// Add this to your global types or a specific types file if you have one
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
