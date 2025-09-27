// src/app/actions.ts
'use server';

import {
  generateInterviewQuestion,
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
import type { InterviewQuestion, GenerateInterviewQuestionInput } from '@/lib/types';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, startAt } from 'firebase/firestore';


async function fetchQuestionFromDb(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<InterviewQuestion | null> {
  try {
    const questionsRef = collection(firestore, 'interviewQuestions');
    const q = query(questionsRef, where('difficulty', '==', difficulty));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Return null to indicate no questions were found.
      return null;
    }
    
    const questions = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];

    if (!randomQuestion || !randomQuestion.question || !randomQuestion.difficulty) {
        console.error('Fetched document is malformed:', randomQuestion);
        return null;
    }

    return {
      type: 'text',
      difficulty: randomQuestion.difficulty,
      question: randomQuestion.question,
    };
  } catch (error) {
    console.error('Error fetching question from Firestore:', error);
    // If there's an error fetching, we can treat it as "no question found" and let the AI handle it.
    return null;
  }
}

export async function getInterviewQuestion(
  input: GenerateInterviewQuestionInput
): Promise<InterviewQuestion> {
  try {
    const dbQuestion = await fetchQuestionFromDb(input.difficulty);
    
    if (dbQuestion) {
      return dbQuestion;
    }

    // Fallback to AI if no question is found in the database
    console.warn(`No questions found in Firestore for difficulty: ${input.difficulty}. Falling back to AI generation.`);
    const aiQuestionText = await generateInterviewQuestion(input);
    return {
      type: 'text',
      difficulty: input.difficulty,
      question: aiQuestionText,
    };

  } catch (error: any) {
    console.error('Critical error in getInterviewQuestion:', error);
    // In case of a critical failure (e.g., AI service is down), rethrow to let the UI handle it.
    throw new Error("Sorry, I could not get a question at this time. Please try again.");
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
