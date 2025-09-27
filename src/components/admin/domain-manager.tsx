// src/components/admin/domain-manager.tsx
'use client';
import { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
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
  domain: z.string().min(3, { message: 'Domain must be a valid domain name (e.g., example.com).' }).refine(val => val.includes('.'), { message: 'Please enter a valid domain.'}),
});

interface DomainEntry {
  id: string;
  domain: string;
}

export function DomainManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<DomainEntry[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { domain: '' },
  });

  useEffect(() => {
    const fetchDomains = async () => {
      setIsListLoading(true);
      try {
        const domainsCollection = collection(firestore, 'allowedDomains');
        const querySnapshot = await getDocs(domainsCollection);
        const domains = querySnapshot.docs.map(doc => ({ id: doc.id, domain: doc.data().domain } as DomainEntry));
        setAllowedDomains(domains);
      } catch (error) {
        console.error("Error fetching domains: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch allowed domains."
        })
      } finally {
        setIsListLoading(false);
      }
    };
    fetchDomains();
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const domainToAdd = values.domain.toLowerCase();
    
    // Check if domain already exists
    if (allowedDomains.some(d => d.domain === domainToAdd)) {
        toast({
            variant: 'destructive',
            title: 'Domain Exists',
            description: 'This domain is already in the allowed list.',
        });
        setIsLoading(false);
        return;
    }

    try {
      const docRef = await addDoc(collection(firestore, 'allowedDomains'), {
        domain: domainToAdd,
      });
      setAllowedDomains(prev => [...prev, { id: docRef.id, domain: domainToAdd }]);
      toast({ title: "Domain Added", description: `"${domainToAdd}" has been added to the list.`});
      form.reset();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to add the domain.' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    setIsLoading(true);
    try {
        await deleteDoc(doc(firestore, 'allowedDomains', domainId));
        setAllowedDomains(prev => prev.filter(d => d.id !== domainId));
        toast({
            title: 'Domain Deleted',
            description: `"${domainName}" has been removed from the list.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting Domain',
            description: 'Could not remove the domain.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Interviewer Domains</CardTitle>
        <CardDescription>
          Add or remove email domains that are allowed to log in as interviewers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h3 className="font-medium mb-2">Add New Domain</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Domain
                </Button>
              </form>
            </Form>
          </div>

        <div>
            <h3 className="font-medium text-lg mb-4">Allowed Domains</h3>
             {isListLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
             ) : (
                <div className="rounded-md border max-h-64 overflow-y-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {allowedDomains.map(({ id, domain }) => (
                        <TableRow key={id}>
                        <TableCell className="font-medium">{domain}</TableCell>
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
                                    This will permanently remove the domain <strong>{domain}</strong>. Interviewers using this domain will no longer be able to log in.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDomain(id, domain)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
             )}
        </div>
      </CardContent>
    </Card>
  );
}
