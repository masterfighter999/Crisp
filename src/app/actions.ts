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

export async function getInterviewQuestion(
  input: GenerateInterviewQuestionInput
) {
  try {
    const result = await generateInterviewQuestion(input);
    return result;
  } catch (error) {
    console.error('Error in getInterviewQuestion:', error);
    return { question: 'Sorry, I could not generate a question. Let\'s try another one.' };
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
