// src/components/interviewer/add-candidate.tsx
'use client';
import { useState, useRef } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, File, X, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

interface TokenEntry {
  email: string;
  token: string;
}

export function AddCandidate() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState<TokenEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const addEmailAndGenerateToken = async (email: string) => {
    if (!email) return null;

    const tokensCollection = collection(firestore, 'interviewTokens');
    const q = query(tokensCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toast({
        variant: 'destructive',
        title: 'Email Exists',
        description: `A token already exists for ${email}.`,
      });
      return null;
    }

    const token = uuidv4();
    try {
      await addDoc(tokensCollection, {
        email,
        token,
        createdAt: Timestamp.now(),
        isValid: true,
      });
      return { email, token };
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Firestore Error',
        description: 'Could not save the token to the database.',
      });
      return null;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const newEntry = await addEmailAndGenerateToken(values.email);
    if (newEntry) {
      setGeneratedTokens((prev) => [newEntry, ...prev]);
      form.reset();
    }
    setIsLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<{ email: string }>(worksheet);
        
        const newEntries: TokenEntry[] = [];
        for (const row of json) {
          const email = row.email?.trim();
          if (email) {
            const newEntry = await addEmailAndGenerateToken(email);
            if (newEntry) {
              newEntries.push(newEntry);
            }
          }
        }
        setGeneratedTokens(prev => [...newEntries, ...prev]);
        toast({ title: "XLSX Processed", description: `${newEntries.length} new tokens generated.` });
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Token copied to clipboard.' });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Candidate Access</CardTitle>
        <CardDescription>
          Add candidate emails to generate unique interview tokens.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium mb-2">Add Single Candidate</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder="candidate@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate
                </Button>
              </form>
            </Form>
          </div>
          <div>
            <h3 className="font-medium mb-2">Upload XLSX File</h3>
            <div
                className="flex justify-center rounded-lg border border-dashed border-input px-6 py-6 cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">XLSX file with an 'email' column</p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx"
                disabled={isLoading}
              />
          </div>
        </div>

        {generatedTokens.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-4">Generated Tokens</h3>
            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTokens.map(({ email, token }) => (
                    <TableRow key={token}>
                      <TableCell>{email}</TableCell>
                      <TableCell className="font-mono">{token}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token)}>
                          <Copy className="size-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
