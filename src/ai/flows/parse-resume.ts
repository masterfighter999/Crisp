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
  name: z.string().nullable().describe("The full name of the candidate."),
  email: z.string().email().nullable().describe("The email address of the candidate."),
  phone: z.string().nullable().describe("The phone number of the candidate."),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;


export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
    return parseResumeFlow(input);
}

const parseResumePrompt = ai.definePrompt({
    name: 'parseResumePrompt',
    input: {schema: ParseResumeInputSchema},
    output: {schema: ParseResumeOutputSchema},
    prompt: `You are an expert resume parser. Your task is to extract the candidate's full name, email address, and phone number from the provided resume.

    Analyze the following resume document carefully:
    Resume: {{media url=resumeDataUri}}

    Instructions:
    1.  **Full Name**: Look for the most prominent name, usually at the top of the resume. It should be a person's full name.
    2.  **Email Address**: Find a string that matches the standard email format (e.g., user@domain.com).
    3.  **Phone Number**: Identify a sequence of numbers that represents a phone number. It may include parentheses, hyphens, or spaces.

    Output format:
    - Return a JSON object with the fields: \`name\`, \`email\`, and \`phone\`.
    - If a specific piece of information (like a phone number or email) cannot be found in the resume, you MUST return the corresponding field as 'null'. Do not invent information or use empty strings.
    - For example, if you only find the name and email, the output should be: \`{"name": "John Doe", "email": "john.doe@example.com", "phone": null}\`.
    - If you cannot find any of the required fields, return all fields as null.`
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
