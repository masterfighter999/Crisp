'use server';

/**
 * @fileOverview Summarizes the candidate's performance during the interview.
 *
 * - summarizeCandidatePerformance - A function that summarizes the candidate's performance.
 * - SummarizeCandidatePerformanceInput - The input type for the summarizeCandidatePerformance function.
 * - SummarizeCandidatePerformanceOutput - The return type for the summarizeCandidatePerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCandidatePerformanceInputSchema = z.object({
  chatHistory: z.string().describe('The complete chat history of the interview.'),
});
export type SummarizeCandidatePerformanceInput = z.infer<typeof SummarizeCandidatePerformanceInputSchema>;

const SummarizeCandidatePerformanceOutputSchema = z.object({
  finalScore: z.number().describe('The final score of the candidate (out of 100).'),
  summary: z.string().describe('A short summary of the candidate\'s performance.'),
});
export type SummarizeCandidatePerformanceOutput = z.infer<typeof SummarizeCandidatePerformanceOutputSchema>;

export async function summarizeCandidatePerformance(
  input: SummarizeCandidatePerformanceInput
): Promise<SummarizeCandidatePerformanceOutput> {
  return summarizeCandidatePerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCandidatePerformancePrompt',
  input: {schema: SummarizeCandidatePerformanceInputSchema},
  output: {schema: SummarizeCandidatePerformanceOutputSchema},
  prompt: `You are an AI assistant that evaluates candidate performance in technical interviews.

  Based on the following chat history, provide a final score (out of 100) and a short summary of the candidate's performance.

  Chat History:
  {{chatHistory}}

  Final Score:
  Summary: `,
});

const summarizeCandidatePerformanceFlow = ai.defineFlow(
  {
    name: 'summarizeCandidatePerformanceFlow',
    inputSchema: SummarizeCandidatePerformanceInputSchema,
    outputSchema: SummarizeCandidatePerformanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
