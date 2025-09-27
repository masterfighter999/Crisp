'use server';

/**
 * @fileOverview This file defines a Genkit flow for dynamically generating interview questions
 * based on specified difficulty levels and full-stack topics.
 *
 * - generateInterviewQuestion - A function that generates an interview question.
 * - GenerateInterviewQuestionInput - The input type for the generateInterviewQuestion function.
 * - GenerateInterviewQuestionOutput - The return type for the generateInterviewQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionInputSchema = z.object({
  difficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('The difficulty level of the question.'),
  topic: z
    .string()
    .default('full stack')
    .describe('The topic of the interview question. Defaults to full stack.'),
  type: z
    .enum(['text'])
    .describe('The type of question to generate.'),
});
export type GenerateInterviewQuestionInput = z.infer<
  typeof GenerateInterviewQuestionInputSchema
>;

const TextQuestionSchema = z.object({
    type: z.literal('text'),
    question: z.string().describe('The generated interview question.'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the question.'),
});

const GenerateInterviewQuestionOutputSchema = TextQuestionSchema;

export type GenerateInterviewQuestionOutput = z.infer<
  typeof GenerateInterviewQuestionOutputSchema
>;

export async function generateInterviewQuestion(
  input: GenerateInterviewQuestionInput
): Promise<GenerateInterviewQuestionOutput> {
  return generateInterviewQuestionFlow(input);
}

const generateInterviewQuestionPrompt = ai.definePrompt({
  name: 'generateInterviewQuestionPrompt',
  input: {schema: GenerateInterviewQuestionInputSchema},
  output: {schema: GenerateInterviewQuestionOutputSchema},
  prompt: `Generate one interview question about {{topic}} with {{difficulty}} difficulty. The question should be technical and relevant to a full stack developer role using React and Node.js.
  `,
});

const generateInterviewQuestionFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionFlow',
    inputSchema: GenerateInterviewQuestionInputSchema,
    outputSchema: GenerateInterviewQuestionOutputSchema,
  },
  async input => {
    const {output} = await generateInterviewQuestionPrompt(input);
    return output!;
  }
);
