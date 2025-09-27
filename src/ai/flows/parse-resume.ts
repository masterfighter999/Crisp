'use server';

/**
 * @fileOverview Parses a resume file to extract candidate information.
 * 
 * - parseResume - A function that parses a resume.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "A resume file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ParseResumeOutputSchema = z.object({
  name: z.string().optional().describe("The full name of the candidate."),
  email: z.string().email().optional().describe("The email address of the candidate."),
  phone: z.string().optional().describe("The phone number of the candidate."),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;


export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
    return parseResumeFlow(input);
}

const parseResumePrompt = ai.definePrompt({
    name: 'parseResumePrompt',
    input: {schema: ParseResumeInputSchema},
    output: {schema: ParseResumeOutputSchema},
    prompt: `You are an expert resume parser. Extract the candidate's name, email, and phone number from the following resume.
    
    Resume: {{media url=resumeDataUri}}
    
    If any of the fields are not found, leave them blank.`
});


const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {output} = await parseResumePrompt(input);
    return output!;
  }
);
