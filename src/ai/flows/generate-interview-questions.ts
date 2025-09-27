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
import { InterviewQuestion, TextQuestion, MCQQuestion } from '@/lib/types';


const GenerateInterviewQuestionInputSchema = z.object({
  difficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('The difficulty level of the question.'),
  topic: z
    .string()
    .default('full stack')
    .describe('The topic of the interview question. Defaults to full stack.'),
  type: z
    .enum(['text', 'mcq'])
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

const MCQQuestionSchema = z.object({
    type: z.literal('mcq'),
    question: z.string().describe('The multiple-choice question.'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty of the question.'),
    options: z.array(z.string()).length(4).describe('An array of exactly 4 possible answers.'),
    correctAnswer: z.string().describe('The correct answer from the options array.'),
});

const GenerateInterviewQuestionOutputSchema = z.union([TextQuestionSchema, MCQQuestionSchema]);

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
  Your task is to generate a single interview question based on the provided type, difficulty, and topic.
  The topic for the question is: {{topic}}.
  The type of question is: {{type}}.
  The difficulty of the question is: {{difficulty}}.

  Instructions:
  - The question should be technically challenging and relevant to modern full stack development practices, focusing on React and Node.js.
  - If the type is 'text':
    - Provide a clear, open-ended technical question.
    - The output JSON must have 'type', 'question', and 'difficulty' fields.
  - If the type is 'mcq' (multiple-choice question):
    - Provide a clear question.
    - Provide exactly 4 options.
    - One of the options must be the correct answer.
    - The 'correctAnswer' field must exactly match one of the strings in the 'options' array.
    - The output JSON must have 'type', 'question', 'difficulty', 'options', and 'correctAnswer' fields.
  - Ensure the question is clear, concise, and appropriate for the specified difficulty level.
  - Return the output as a single JSON object.
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
