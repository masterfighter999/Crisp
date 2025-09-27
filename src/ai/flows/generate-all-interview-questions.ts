'use server';

/**
 * @fileOverview This file defines a Genkit flow for dynamically generating a full set of interview questions
 * based on a predefined schedule of difficulty levels.
 *
 * - generateAllInterviewQuestions - A function that generates a list of interview questions.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateAllInterviewQuestionsInputSchema,
  GenerateAllInterviewQuestionsOutputSchema,
  type GenerateAllInterviewQuestionsInput,
  type GenerateAllInterviewQuestionsOutput,
} from './generate-all-interview-questions.types';

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