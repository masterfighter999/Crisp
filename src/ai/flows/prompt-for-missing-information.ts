// src/ai/flows/prompt-for-missing-information.ts
'use server';
/**
 * @fileOverview Prompts the candidate for any missing information after resume parsing.
 *
 * - promptForMissingInformation - A function that prompts for missing information.
 * - PromptForMissingInformationInput - The input type for the promptForMissingInformation function.
 * - PromptForMissingInformationOutput - The return type for the promptForMissingInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PromptForMissingInformationInputSchema = z.object({
  name: z.string().optional().describe('The name of the candidate.'),
  email: z.string().email().optional().describe('The email address of the candidate.'),
  phone: z.string().optional().describe('The phone number of the candidate.'),
});
export type PromptForMissingInformationInput = z.infer<typeof PromptForMissingInformationInputSchema>;

const PromptForMissingInformationOutputSchema = z.object({
  name: z.string().describe('The name of the candidate.'),
  email: z.string().email().describe('The email address of the candidate.'),
  phone: z.string().describe('The phone number of the candidate.'),
  missingFieldsPrompt: z.string().optional().describe('A message to prompt the user with the missing fields, if any.'),
});
export type PromptForMissingInformationOutput = z.infer<typeof PromptForMissingInformationOutputSchema>;

export async function promptForMissingInformation(
  input: PromptForMissingInformationInput
): Promise<PromptForMissingInformationOutput> {
  return promptForMissingInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'promptForMissingInformationPrompt',
  input: {schema: PromptForMissingInformationInputSchema},
  output: {schema: PromptForMissingInformationOutputSchema},
  prompt: `You are a helpful chatbot assistant that helps collect missing information from a candidate before an interview starts.

  The candidate has the following information:
  Name: {{name}}
  Email: {{email}}
  Phone: {{phone}}

  Determine which of these fields are missing. If any are missing, create a friendly, conversational message to prompt the user for the missing information. If none are missing, return an empty string for missingFieldsPrompt.

  For example, if the phone number is missing, you might say: "Hi, before we start the interview, could you please provide your phone number?"
  If the name and email are missing, you might say: "Hi, before we start the interview, could you please provide your name and email address?"
  Be as concise as possible.

  Return a JSON object with the original information, as well as the missingFieldsPrompt. If a field was missing, but you received it in the chat, update it in the returned object.
  Ensure that the name, email, and phone fields are always present in the output. If they are initially missing, return empty strings.`,
});

const promptForMissingInformationFlow = ai.defineFlow(
  {
    name: 'promptForMissingInformationFlow',
    inputSchema: PromptForMissingInformationInputSchema,
    outputSchema: PromptForMissingInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
