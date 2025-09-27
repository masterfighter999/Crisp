import { z } from 'zod';

export type InterviewStatus =
  | 'NOT_STARTED'
  | 'COLLECTING_INFO'
  | 'READY_TO_START'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type TextQuestion = {
  type: 'text';
  question: string;
  difficulty: QuestionDifficulty;
}

export type InterviewQuestion = TextQuestion;


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewRecord {
  status: InterviewStatus;
  questions: InterviewQuestion[];
  answers: string[];
  currentQuestionIndex: number;
  score: number | null;
  summary: string | null;
  startTime: number | null;
  endTime: number | null;
  chatHistory: ChatMessage[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile: {
    name: string;
    size: number;
  } | null;
  interview: InterviewRecord;
  companyDomain?: string; // Added to partition data by company
}

export const GenerateInterviewQuestionInputSchema = z.object({
  difficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('The difficulty level of the question.'),
  topic: z
    .string()
    .default('full stack')
    .describe('The topic of the interview question. Defaults to full stack.'),
});

export type GenerateInterviewQuestionInput = z.infer<
  typeof GenerateInterviewQuestionInputSchema
>;
