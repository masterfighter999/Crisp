// src/components/interviewer/add-candidate.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
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
import { Loader2, UploadCloud, File, X, Copy, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

interface TokenEntry {
  id: string;
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

  useEffect(() => {
    const fetchTokens = async () => {
      setIsLoading(true);
      try {
        const tokensCollection = collection(firestore, 'interviewTokens');
        const q = query(tokensCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const tokens = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TokenEntry));
        setGeneratedTokens(tokens);
      } catch (error) {
        console.error("Error fetching tokens: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch existing tokens."
        })
      } finally {
        setIsLoading(false);
      }
    };
    fetchTokens();
  }, [toast]);

  const addEmailAndGenerateToken = async (email: string): Promise<TokenEntry | null> => {
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
      const docRef = await addDoc(tokensCollection, {
        email,
        token,
        createdAt: Timestamp.now(),
        isValid: true,
      });
      return { id: docRef.id, email, token };
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
  
  const handleDeleteToken = async (tokenId: string) => {
    setIsLoading(true);
    try {
        await deleteDoc(doc(firestore, 'interviewTokens', tokenId));
        setGeneratedTokens(prev => prev.filter(t => t.id !== tokenId));
        toast({
            title: 'Token Deleted',
            description: 'The token has been successfully removed.',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting Token',
            description: 'Could not remove the token from the database.',
        });
    } finally {
        setIsLoading(false);
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
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Use sheet_to_json with header: 1 to get an array of arrays.
          const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
          
          // Check if the first row looks like a header (i.e., not an email)
          const firstRowFirstCell = rows[0]?.[0] || '';
          const hasHeader = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(firstRowFirstCell);
          
          // If there is a header, start from the second row, otherwise start from the first.
          const dataRows = hasHeader ? rows.slice(1) : rows;

          const emails = dataRows.map(row => row[0]?.trim()).filter(email => !!email);

          const tokenPromises = emails.map(email => addEmailAndGenerateToken(email));
          
          const newEntries = (await Promise.all(tokenPromises)).filter((entry): entry is TokenEntry => entry !== null);
          
          if (newEntries.length > 0) {
            setGeneratedTokens(prev => [...newEntries, ...prev]);
          }
          
          toast({ title: "XLSX Processed", description: `${newEntries.length} new tokens generated from ${emails.length} unique emails.` });

        } catch (error) {
           toast({ title: "XLSX Processing Failed", description: "There was an error processing the file." });
           console.error(error);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
      };
      reader.readAsArrayBuffer(file);
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
                  <p className="text-xs text-muted-foreground">XLSX file with emails in the first column</p>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTokens.map(({ id, email, token }) => (
                    <TableRow key={id}>
                      <TableCell>{email}</TableCell>
                      <TableCell className="font-mono">{token}</TableCell>
                      <TableCell className="text-right">
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                              <Trash2 className="size-4 text-destructive"/>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the token for {email}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteToken(id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
