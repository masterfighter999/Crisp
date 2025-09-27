/**
 * @fileOverview This file defines the Zod schemas and TypeScript types for the 
 * generateAllInterviewQuestions AI flow.
 *
 * - GenerateAllInterviewQuestionsInput - The input type for the generateAllInterviewQuestions function.
 * - GenerateAllInterviewQuestionsOutput - The return type for the generateAllInterviewQuestions function.
 */

import {z} from 'genkit';

const TextQuestionSchema = z.object({
    type: z.literal('text'),
    question: z.string().describe('The generated interview question.'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the question.'),
});

const MCQQuestionSchema = z.object({
    type: z.literal('mcq'),
    question: z.string().describe('The multiple-choice question.'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the question.'),
    options: z.array(z.string()).length(4).describe('An array of exactly 4 possible answers.'),
    correctAnswer: z.string().describe('The correct answer from the options array.'),
});

const QuestionSchema = z.union([TextQuestionSchema, MCQQuestionSchema]);


export const GenerateAllInterviewQuestionsInputSchema = z.object({
  topic: z
    .string()
    .default('full stack')
    .describe('The topic of the interview questions. Defaults to full stack.'),
  schedule: z.array(z.object({
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
      type: z.enum(['text', 'mcq']),
      duration: z.number(),
  })).describe('The schedule of questions to generate, defining difficulty and type for each.'),
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
