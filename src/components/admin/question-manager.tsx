// src/components/admin/question-manager.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import type { InterviewQuestion, QuestionDifficulty } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, UploadCloud, BookMarked } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  questionText: z.string().min(10, { message: 'Question must be at least 10 characters.' }),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

type QuestionEntry = InterviewQuestion & { id: string };

export function QuestionManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionEntry[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { questionText: '', difficulty: 'Medium' },
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsListLoading(true);
      try {
        const questionsCollection = collection(firestore, 'interviewQuestions');
        const q = query(questionsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionEntry));
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Error fetching questions: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch questions." });
      } finally {
        setIsListLoading(false);
      }
    };
    fetchQuestions();
  }, [toast]);
  
  const addQuestionToDb = async (question: Omit<InterviewQuestion, 'type'>): Promise<QuestionEntry | null> => {
      try {
          const docRef = await addDoc(collection(firestore, 'interviewQuestions'), {
            ...question,
            type: 'text',
            createdAt: Timestamp.now(),
          });
          return { id: docRef.id, ...question, type: 'text' };
      } catch (error) {
          console.error("Error adding question:", error);
          return null;
      }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const newQuestion = await addQuestionToDb(values);
    if(newQuestion) {
        setQuestions(prev => [newQuestion, ...prev]);
        toast({ title: "Question Added", description: "The new question has been saved." });
        form.reset();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add the question.' });
    }
    setIsLoading(false);
  };
  
  const handleDeleteQuestion = async (questionId: string) => {
    setIsLoading(true);
    try {
        await deleteDoc(doc(firestore, 'interviewQuestions', questionId));
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        toast({ title: 'Question Deleted', description: 'The question has been removed.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error Deleting Question', description: 'Could not remove the question.' });
    } finally {
        setIsLoading(false);
    }
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
          
          const rows = XLSX.utils.sheet_to_json<{questionText: string, difficulty: string}>(worksheet);

          const newQuestions: Omit<InterviewQuestion, 'type'>[] = rows.map(row => ({
              questionText: row.questionText,
              difficulty: row.difficulty as QuestionDifficulty
          })).filter(q => q.questionText && ['Easy', 'Medium', 'Hard'].includes(q.difficulty));


          const questionPromises = newQuestions.map(q => addQuestionToDb(q));
          const addedQuestions = (await Promise.all(questionPromises)).filter((q): q is QuestionEntry => q !== null);
          
          if (addedQuestions.length > 0) {
            setQuestions(prev => [...addedQuestions, ...prev].sort((a, b) => (b as any).createdAt.toMillis() - (a as any).createdAt.toMillis()));
          }
          
          toast({ title: "XLSX Processed", description: `${addedQuestions.length} new questions were added.` });

        } catch (error) {
           toast({ variant: "destructive", title: "XLSX Processing Failed", description: "Could not process file. Ensure columns are 'questionText' and 'difficulty'." });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BookMarked className="size-6" />
            Manage Interview Questions
        </CardTitle>
        <CardDescription>
          Add, remove, or bulk upload questions to the central question bank for interviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="font-medium mb-2">Add Single Question</h3>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                            <Input placeholder="What is a closure in JavaScript?" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Question
                    </Button>
                </form>
                </Form>
            </div>
            <div>
                <h3 className="font-medium mb-2">Bulk Upload from XLSX</h3>
                <div
                    className="flex h-full items-center justify-center rounded-lg border border-dashed border-input p-6 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">XLSX file with 'questionText' and 'difficulty' columns</p>
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

        <div>
            <h3 className="font-medium text-lg mb-4">Question Bank</h3>
             {isListLoading ? (
                <div className="flex justify-center items-center h-24">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
             ) : (
                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Question</TableHead>
                            <TableHead className="w-[100px]">Difficulty</TableHead>
                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {questions.map((q) => (
                        <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.questionText}</TableCell>
                        <TableCell>{q.difficulty}</TableCell>
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
                                    This will permanently remove this question from the database.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteQuestion(q.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
