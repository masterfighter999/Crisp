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
import { InterviewQuestion, TextQuestion } from '@/lib/types';


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
  prompt: `You are an AI assistant designed to generate interview questions for full stack developer roles.
  Your task is to generate a single interview question based on the provided difficulty and topic.
  The topic for the question is: {{topic}}.
  The difficulty of the question is: {{difficulty}}.

  Instructions:
  - The question should be technically challenging and relevant to modern full stack development practices, focusing on React and Node.js.
  - If the difficulty is 'Easy', generate a question that can be answered with a single word.
  - If the difficulty is 'Medium' or 'Hard', provide a clear, open-ended technical question.
  - Ensure the question is clear, concise, and appropriate for the specified difficulty level.
  - Return the output as a single JSON object with 'type', 'question', and 'difficulty' fields.
  - Do not add any conversational text, preamble, or extraneous explanations in your response.
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
