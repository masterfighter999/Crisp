export type InterviewStatus =
  | 'NOT_STARTED'
  | 'COLLECTING_INFO'
  | 'READY_TO_START'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type TextQuestion = {
  type: 'text';
  question: string;
  difficulty: QuestionDifficulty;
}

export type MCQQuestion = {
  type: 'mcq';
  question: string;
  difficulty: QuestionDifficulty;
  options: string[];
  correctAnswer: string;
}

export type InterviewQuestion = TextQuestion | MCQQuestion;


export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewRecord {
  status: InterviewStatus;
  questions: InterviewQuestion[];
  answers: (string | number)[]; // string for text, number for MCQ index
  currentQuestionIndex: number;
  score: number | null;
  summary: string | null;
  startTime: number | null;
  endTime: number | null;
  chatHistory: ChatMessage[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeFile: {
    name: string;
    size: number;
  } | null;
  interview: InterviewRecord;
  companyDomain?: string; // Added to partition data by company
}
