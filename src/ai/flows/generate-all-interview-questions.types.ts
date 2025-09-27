/**
 * @fileOverview This file defines the Zod schemas and TypeScript types for the 
 * generateAllInterviewQuestions AI flow.
 *
 * - GenerateAllInterviewQuestionsInput - The input type for the generateAllInterviewQuestions function.
 * - GenerateAllInterviewQuestionsOutput - The return type for the generateAllInterviewQuestions function.
 */

import {z} from 'genkit';

const QuestionSchema = z.object({
    question: z.string().describe('The generated interview question.'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the question.'),
});

export const GenerateAllInterviewQuestionsInputSchema = z.object({
  topic: z
    .string()
    .default('full stack')
    .describe('The topic of the interview questions. Defaults to full stack.'),
  schedule: z.array(z.object({
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
      duration: z.number(),
  })).describe('The schedule of questions to generate, defining difficulty for each.'),
});
export type GenerateAllInterviewQuestionsInput = z.infer<
  typeof GenerateAllInterviewQuestionsInputSchema
>;

export const GenerateAllInterviewQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('The list of generated interview questions.'),
});
export type GenerateAllInterviewQuestionsOutput = z.infer<
  typeof GenerateAllInterviewQuestionsOutputSchema
>;
