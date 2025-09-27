'use server';

/**
 * @fileOverview This file defines a Genkit flow for dynamically generating a full set of interview questions
 * based on a predefined schedule of difficulty levels.
 *
 * - generateAllInterviewQuestions - A function that generates a list of interview questions.
 * - GenerateAllInterviewQuestionsInput - The input type for the generateAllInterviewQuestions function.
 * - GenerateAllInterviewQuestionsOutput - The return type for the generateAllInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { InterviewQuestion } from '@/lib/types';

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

const GenerateAllInterviewQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('The list of generated interview questions.'),
});
export type GenerateAllInterviewQuestionsOutput = z.infer<
  typeof GenerateAllInterviewQuestionsOutputSchema
>;

export async function generateAllInterviewQuestions(
  input: GenerateAllInterviewQuestionsInput
): Promise<GenerateAllInterviewQuestionsOutput> {
  return generateAllInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAllInterviewQuestionsPrompt',
  input: {schema: GenerateAllInterviewQuestionsInputSchema},
  output: {schema: GenerateAllInterviewQuestionsOutputSchema},
  prompt: `You are an AI assistant designed to generate interview questions for full stack developer roles.
  Your task is to generate a series of interview questions based on the provided schedule of difficulties.
  
  The topic for all questions is: {{topic}}.

  Generate one question for each of the following difficulties:
  {{#each schedule}}
  - {{this.difficulty}}
  {{/each}}
  
  Instructions:
  - The questions should be technically challenging and relevant to modern full stack development practices, focusing on React and Node.js.
  - Ensure the questions are clear, concise, and appropriate for the specified difficulty level.
  - Return the output as a JSON object containing a 'questions' array. Each object in the array should have a 'question' and its corresponding 'difficulty'.
  - Do not add any conversational text, preamble, or extraneous explanations in your response.
  `,
});

const generateAllInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateAllInterviewQuestionsFlow',
    inputSchema: GenerateAllInterviewQuestionsInputSchema,
    outputSchema: GenerateAllInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
