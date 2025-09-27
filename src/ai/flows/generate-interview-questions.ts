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
});
export type GenerateInterviewQuestionInput = z.infer<
  typeof GenerateInterviewQuestionInputSchema
>;

const GenerateInterviewQuestionOutputSchema = z.object({
  question: z.string().describe('The generated interview question.'),
});
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
  prompt: `You are an AI assistant designed to generate interview questions for full stack developer roles.
  Generate a {{difficulty}} difficulty question on the topic of {{topic}}.
  The question should be technically challenging and relevant to modern full stack development practices.
  Focus on React and Node, but also be open to other frameworks if they are relevant to full stack.
  Ensure the question is clear, concise, and can be answered within a reasonable timeframe (20s for Easy, 60s for Medium, 120s for Hard).
  Output ONLY the question itself.
  DO NOT add ANY conversational text or preamble.`,
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
