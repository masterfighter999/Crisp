'use client';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInterviewStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UploadCloud, File, X, PartyPopper, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseResumeAction } from '@/app/actions';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
});

export function Onboarding() {
  const { createCandidate, getActiveCandidate, updateCandidateInfo, startInterview, activeCandidateId, activeToken } = useInterviewStore();
  const [resumeFile, setResumeFile] = useState<{ name: string; size: number } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const activeCandidate = getActiveCandidate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: activeCandidate?.name || '',
      email: activeCandidate?.email || '',
      phone: activeCandidate?.phone || '',
    },
  });
  
  useEffect(() => {
    const initializeCandidate = async () => {
      if (activeToken && !activeCandidateId) {
        // Fetch the token document to get email and companyDomain
        const tokensCollection = collection(firestore, 'interviewTokens');
        const q = query(tokensCollection, where('token', '==', activeToken));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const tokenDoc = querySnapshot.docs[0].data();
          const email = tokenDoc.email;
          const companyDomain = tokenDoc.companyDomain;
          // Pass companyDomain when creating candidate
          await createCandidate(email, companyDomain);
          form.setValue('email', email);
        }
      } else if (activeCandidate) {
        form.reset({
          name: activeCandidate.name,
          email: activeCandidate.email,
          phone: activeCandidate.phone
        });
      }
    };
    initializeCandidate();
  }, [activeToken, activeCandidateId, user]);


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        if (!activeCandidateId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Cannot upload resume without an active session. Please re-validate your token.'
            });
            return;
        }
        
        const fileDetails = { name: file.name, size: file.size };
        setResumeFile(fileDetails);

        setIsParsing(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const resumeDataUri = reader.result as string;
          try {
            const parsedData = await parseResumeAction({ resumeDataUri });
            
            if (parsedData) {
              const tokenEmail = form.getValues('email');
              if (parsedData.email && parsedData.email.toLowerCase() !== tokenEmail.toLowerCase()) {
                  toast({
                      title: 'Email Mismatch',
                      description: `The email on your resume (${parsedData.email}) doesn't match the invited email (${tokenEmail}). This is just a warning.`,
                      variant: 'default'
                  });
              }

              const updatedInfo = {
                name: parsedData.name || form.getValues('name'),
                email: tokenEmail, // Always keep the original email from token
                phone: parsedData.phone || form.getValues('phone'),
                resumeFile: fileDetails
              };
              
              await updateCandidateInfo(activeCandidateId, updatedInfo);
              
              if (parsedData.name) form.setValue('name', parsedData.name);
              if (parsedData.phone) form.setValue('phone', parsedData.phone);
              
              toast({
                title: 'Resume Parsed',
                description: `Name: ${parsedData.name || 'Not found'}\nPhone: ${parsedData.phone || 'Not found'}`,
              });
            }
          } catch (error) {
             toast({
              variant: 'destructive',
              title: 'Parsing Failed',
              description: 'We could not parse your resume. Please fill in the details manually.',
            });
          } finally {
            setIsParsing(false);
          }
        };
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
        });
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if(!activeCandidateId) return;
    if(!resumeFile) {
        toast({
            variant: 'destructive',
            title: 'Resume Required',
            description: 'Please upload your resume to continue.',
        });
        return;
    }
    updateCandidateInfo(activeCandidateId, { ...values, resumeFile });
  };
  
  const handleStartInterview = () => {
    if(activeCandidate) {
      startInterview(activeCandidate.id);
    }
  }

  if (activeCandidate?.interview.status === 'READY_TO_START') {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 text-center">
        <CardHeader>
           <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
             <PartyPopper className="size-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're all set, {activeCandidate.name}!</CardTitle>
          <CardDescription>
            Click the button below to start your AI-powered interview. Good luck!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={handleStartInterview}>
            Start Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Welcome to AI Interview Ace</CardTitle>
        <CardDescription>
          Please upload your resume (PDF required) to auto-fill your information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormLabel>Resume (PDF required)</FormLabel>
              <div
                className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 cursor-pointer hover:border-primary transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
                onClick={() => !isParsing && fileInputRef.current?.click()}
                data-disabled={isParsing}
              >
                <div className="text-center">
                  {isParsing ? (
                    <>
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">Parsing resume...</p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                        <p className="pl-1">Click to upload or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">PDF (10MB max)</p>
                    </>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
                disabled={isParsing}
              />
              {resumeFile && !isParsing && (
                <div className="mt-4 flex items-center justify-between bg-muted/50 p-3 rounded-md">
                  <div className="flex items-center gap-3">
                    <File className="size-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{resumeFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setResumeFile(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isParsing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} disabled={isParsing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isParsing}>
              {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save and Continue
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
