'use server';

/**
 * @fileOverview This file defines a Genkit flow for dynamically generating interview questions
 * based on specified difficulty levels and full-stack topics.
 *
 * - generateInterviewQuestion - A function that generates an interview question.
 * - GenerateInterviewQuestionInput - The input type for the generateInterviewQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function generateInterviewQuestion(
  input: GenerateInterviewQuestionInput
): Promise<string> {
  return generateInterviewQuestionFlow(input);
}

const generateInterviewQuestionPrompt = ai.definePrompt({
  name: 'generateInterviewQuestionPrompt',
  input: {schema: GenerateInterviewQuestionInputSchema},
  prompt: `Generate one technical interview question about {{topic}} with {{difficulty}} difficulty.
The question should be relevant to a full stack developer role using React and Node.js.
Return only the question text, with no preamble or other text.
`,
});

const generateInterviewQuestionFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionFlow',
    inputSchema: GenerateInterviewQuestionInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    const {text} = await generateInterviewQuestionPrompt(input);
    return text;
  }
);
