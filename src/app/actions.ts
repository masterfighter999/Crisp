// src/app/actions.ts
'use server';

import {
  generateInterviewQuestion,
  type GenerateInterviewQuestionInput,
} from '@/ai/flows/generate-interview-questions';
import {
  promptForMissingInformation,
  type PromptForMissingInformationInput,
} from '@/ai/flows/prompt-for-missing-information';
import {
  summarizeCandidatePerformance,
  type SummarizeCandidatePerformanceInput,
} from '@/ai/flows/summarize-candidate-performance';
import {
  parseResume,
  type ParseResumeInput,
} from '@/ai/flows/parse-resume';
import type { InterviewQuestion } from '@/lib/types';


export async function getInterviewQuestion(
  input: GenerateInterviewQuestionInput
): Promise<InterviewQuestion> {
  try {
    const questionText = await generateInterviewQuestion(input);
    if (!questionText) {
      throw new Error('AI returned an empty question.');
    }
    // Structure the raw text into the expected object format
    return {
      type: 'text',
      difficulty: input.difficulty,
      question: questionText,
    };
  } catch (error) {
    console.error('Error in getInterviewQuestion:', error);
    // Throw error to be caught by the client component for better UX
    throw new Error("Sorry, I could not generate a question.");
  }
}

export async function getMissingInfoPrompt(
  input: PromptForMissingInformationInput
) {
  try {
    const result = await promptForMissingInformation(input);
    return result;
  } catch (error) {
    console.error('Error in getMissingInfoPrompt:', error);
    return null;
  }
}

export async function getInterviewSummary(
  input: SummarizeCandidatePerformanceInput
) {
  try {
    const result = await summarizeCandidatePerformance(input);
    return result;
  } catch (error) {
    console.error('Error in getInterviewSummary:', error);
    return { summary: 'Could not generate summary.', score: 0 };
  }
}

export async function parseResumeAction(input: ParseResumeInput) {
  try {
    const result = await parseResume(input);
    return result;
  } catch (error) {
    console.error('Error in parseResumeAction:', error);
    return { name: '', email: '', phone: ''};
  }
}
