'use client';
import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInterviewStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UploadCloud, File, X, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
});

export function Onboarding() {
  const { createCandidate, getActiveCandidate, updateCandidateInfo, startInterview } = useInterviewStore();
  const [resumeFile, setResumeFile] = useState<{ name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const activeCandidate = getActiveCandidate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const candidateId = activeCandidate?.id || createCandidate();
        setResumeFile({ name: file.name, size: file.size });
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF or DOCX file.',
        });
      }
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (activeCandidate) {
      updateCandidateInfo(activeCandidate.id, { ...values, resumeFile });
    }
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
          Let's get started. Upload your resume or fill out your details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <FormLabel>Resume (PDF or DOCX)</FormLabel>
            <div
              className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                  <p className="pl-1">Click to upload or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">PDF, DOCX up to 10MB</p>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx"
            />
            {resumeFile && (
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
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
                      <Input placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Save and Continue
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
