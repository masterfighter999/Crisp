'use server';

/**
 * @fileOverview This file defines a Genkit flow for dynamically generating interview questions
 * based on specified difficulty levels and full-stack topics. This serves as a fallback
 * if no questions are found in the Firestore database.
 *
 * - generateInterviewQuestion - A function that generates an interview question.
 * - GenerateInterviewQuestionInput - The input type for the generateInterviewQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateInterviewQuestionInput, GenerateInterviewQuestionInputSchema } from '@/lib/types';


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
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
    ],
  }
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
