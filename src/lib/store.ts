'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Candidate, InterviewStatus, ChatMessage, InterviewQuestion } from './types';
import { v4 as uuidv4 } from 'uuid';

export const INTERVIEW_SCHEDULE: { difficulty: 'Easy' | 'Medium' | 'Hard'; duration: number }[] = [
  { difficulty: 'Easy', duration: 20 },
  { difficulty: 'Easy', duration: 20 },
  { difficulty: 'Medium', duration: 60 },
  { difficulty: 'Medium', duration: 60 },
  { difficulty: 'Hard', duration: 120 },
  { difficulty: 'Hard', duration: 120 },
];

interface InterviewState {
  candidates: Candidate[];
  activeCandidateId: string | null;
  hydrated: boolean;
  createCandidate: () => string;
  updateCandidateInfo: (id: string, info: { name: string; email: string; phone: string; resumeFile: Candidate['resumeFile'] }) => void;
  setInterviewStatus: (candidateId: string, status: InterviewStatus) => void;
  startInterview: (candidateId: string) => void;
  addAiChatMessage: (candidateId: string, content: string) => void;
  addUserChatMessage: (candidateId: string, content: string) => void;
  addQuestion: (candidateId: string, question: InterviewQuestion) => void;
  submitAnswer: (candidateId: string, answer: string) => void;
  completeInterview: (candidateId: string, summary: string, score: number) => void;
  getActiveCandidate: () => Candidate | null;
  startOver: (candidateId: string) => void;
  resetActiveCandidate: () => void;
  setHydrated: (state: boolean) => void;
}

const initialInterviewRecord = {
  status: 'COLLECTING_INFO' as InterviewStatus,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  score: null,
  summary: null,
  startTime: null,
  endTime: null,
  chatHistory: [],
};

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      candidates: [],
      activeCandidateId: null,
      hydrated: false,
      setHydrated: (state) => set({ hydrated: state }),
      createCandidate: () => {
        const id = uuidv4();
        const newCandidate: Candidate = {
          id,
          name: '',
          email: '',
          phone: '',
          resumeFile: null,
          interview: { ...initialInterviewRecord },
        };
        set((state) => ({
          candidates: [...state.candidates, newCandidate],
          activeCandidateId: id,
        }));
        return id;
      },
      updateCandidateInfo: (id, info) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === id ? { ...c, ...info, interview: { ...c.interview, status: 'READY_TO_START' } } : c
          ),
        }));
      },
      setInterviewStatus: (candidateId, status) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, interview: { ...c.interview, status } } : c
          ),
        }));
      },
      startInterview: (candidateId) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  interview: {
                    ...c.interview,
                    status: 'IN_PROGRESS',
                    startTime: Date.now(),
                  },
                }
              : c
          ),
        }));
      },
      addAiChatMessage: (candidateId, content) => {
        const message: ChatMessage = { role: 'assistant', content };
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? { ...c, interview: { ...c.interview, chatHistory: [...c.interview.chatHistory, message] } }
              : c
          ),
        }));
      },
      addUserChatMessage: (candidateId, content) => {
        const message: ChatMessage = { role: 'user', content };
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? { ...c, interview: { ...c.interview, chatHistory: [...c.interview.chatHistory, message] } }
              : c
          ),
        }));
      },
      addQuestion: (candidateId, question) => {
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
              const newQuestions = [...c.interview.questions, question];
              return {
                ...c,
                interview: {
                  ...c.interview,
                  questions: newQuestions,
                },
              };
            }
            return c;
          }),
        }));
      },
      submitAnswer: (candidateId, answer) => {
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
              const newAnswers = [...c.interview.answers, answer];
              return {
                ...c,
                interview: {
                  ...c.interview,
                  answers: newAnswers,
                  currentQuestionIndex: c.interview.currentQuestionIndex + 1,
                },
              };
            }
            return c;
          }),
        }));
      },
      completeInterview: (candidateId, summary, score) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  interview: {
                    ...c.interview,
                    status: 'COMPLETED',
                    summary,
                    score,
                    endTime: Date.now(),
                  },
                }
              : c
          ),
        }));
      },
      getActiveCandidate: () => {
        const { candidates, activeCandidateId } = get();
        return candidates.find((c) => c.id === activeCandidateId) || null;
      },
      startOver: (candidateId) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  name: '',
                  email: '',
                  phone: '',
                  resumeFile: null,
                  interview: { ...initialInterviewRecord },
                }
              : c
          ),
        }));
      },
      resetActiveCandidate: () => {
        set({ activeCandidateId: null });
      },
    }),
    {
      name: 'ai-interview-ace-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
