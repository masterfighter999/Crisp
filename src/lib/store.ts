'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Candidate, InterviewStatus, ChatMessage, InterviewQuestion } from './types';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';

export const INTERVIEW_SCHEDULE: { difficulty: 'Easy' | 'Medium' | 'Hard'; type: 'text'; duration: number }[] = [
  { difficulty: 'Easy', type: 'text', duration: 30 },
  { difficulty: 'Easy', type: 'text', duration: 30 },
  { difficulty: 'Medium', type: 'text', duration: 60 },
  { difficulty: 'Medium', type: 'text', duration: 90 },
  { difficulty: 'Hard', type: 'text', duration: 120 },
  { difficulty: 'Hard', type: 'text', duration: 120 },
];

interface InterviewState {
  candidates: Candidate[];
  activeCandidateId: string | null;
  activeToken: string | null;
  hydrated: boolean;
  fetchCandidate: (candidateId: string) => Promise<void>;
  createCandidate: (email: string, companyDomain?: string) => Promise<string>;
  updateCandidateInfo: (id: string, info: { name: string; email: string; phone: string; resumeFile: Candidate['resumeFile'] }) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  setInterviewStatus: (candidateId: string, status: InterviewStatus) => Promise<void>;
  startInterview: (candidateId: string, questions: InterviewQuestion[]) => Promise<void>;
  addAiChatMessage: (candidateId: string, content: string) => Promise<void>;
  addUserChatMessage: (candidateId: string, content: string) => Promise<void>;
  addQuestion: (candidateId: string, question: InterviewQuestion) => Promise<void>;
  submitAnswer: (candidateId: string, answer: string) => Promise<void>;
  completeInterview: (candidateId: string, summary: string, score: number) => Promise<void>;
  getActiveCandidate: () => Candidate | null;
  startOver: (candidateId: string) => Promise<void>;
  resetActiveCandidate: () => void;
  setHydrated: (state: boolean) => void;
  setToken: (token: string) => void;
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

const updateFirestoreCandidate = async (candidate: Candidate) => {
  try {
    const candidateRef = doc(firestore, 'candidates', candidate.id);
    await setDoc(candidateRef, candidate, { merge: true });
  } catch (error) {
    console.error("Error updating Firestore candidate: ", error);
  }
};

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      candidates: [],
      activeCandidateId: null,
      activeToken: null,
      hydrated: false,
      setHydrated: (state) => set({ hydrated: state }),
      setToken: (token) => {
        set({ activeToken: token });
      },
      fetchCandidate: async (candidateId) => {
        try {
            const candidateRef = doc(firestore, 'candidates', candidateId);
            const docSnap = await getDoc(candidateRef);
            if (docSnap.exists()) {
                const candidateData = docSnap.data() as Candidate;
                set(state => ({
                    candidates: [...state.candidates.filter(c => c.id !== candidateId), candidateData]
                }));
            }
        } catch (error) {
            console.error("Error fetching candidate from Firestore: ", error);
        }
      },
      createCandidate: async (email, companyDomain) => {
        // A user can interview for multiple companies, so we don't check for existing email here anymore.
        // Uniqueness will be handled by the interview token process.
        
        const id = uuidv4();
        const newCandidate: Candidate = {
          id,
          name: '',
          email: email,
          phone: '',
          resumeFile: null,
          interview: { ...initialInterviewRecord },
          companyDomain, // Tag candidate with company domain
        };
        
        await updateFirestoreCandidate(newCandidate);

        set((state) => ({
          candidates: [...state.candidates, newCandidate],
          activeCandidateId: id,
        }));
        return id;
      },
      updateCandidateInfo: async (id, info) => {
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === id) {
              updatedCandidate = { ...c, ...info, interview: { ...c.interview, status: 'READY_TO_START' } };
              return updatedCandidate;
            }
            return c;
          }),
        }));
        if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      deleteCandidate: async (id: string) => {
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
        }));
        try {
          const candidateRef = doc(firestore, 'candidates', id);
          await deleteDoc(candidateRef);
        } catch (error) {
          console.error("Error deleting candidate from Firestore: ", error);
        }
      },
      setInterviewStatus: async (candidateId, status) => {
         let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
             if (c.id === candidateId) {
                updatedCandidate = { ...c, interview: { ...c.interview, status } };
                return updatedCandidate;
             }
             return c;
          }),
        }));
        if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      startInterview: async (candidateId, questions) => {
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
                updatedCandidate = {
                  ...c,
                  interview: {
                    ...c.interview,
                    status: 'IN_PROGRESS',
                    startTime: Date.now(),
                    questions: questions,
                  },
                };
                return updatedCandidate;
              }
              return c;
          }),
        }));
         if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      addAiChatMessage: async (candidateId, content) => {
        const message: ChatMessage = { role: 'assistant', content };
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
               updatedCandidate = { ...c, interview: { ...c.interview, chatHistory: [...c.interview.chatHistory, message] } };
               return updatedCandidate;
            }
            return c;
          }),
        }));
         if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      addUserChatMessage: async (candidateId, content) => {
        const message: ChatMessage = { role: 'user', content };
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
              updatedCandidate = { ...c, interview: { ...c.interview, chatHistory: [...c.interview.chatHistory, message] } };
              return updatedCandidate;
            }
            return c;
          }),
        }));
         if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      addQuestion: async (candidateId, question) => {
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
              const newQuestions = [...c.interview.questions, question];
              updatedCandidate = {
                ...c,
                interview: {
                  ...c.interview,
                  questions: newQuestions,
                },
              };
              return updatedCandidate;
            }
            return c;
          }),
        }));
         if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      submitAnswer: async (candidateId, answer) => {
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
              const newAnswers = [...c.interview.answers, answer];
              updatedCandidate = {
                ...c,
                interview: {
                  ...c.interview,
                  answers: newAnswers,
                  currentQuestionIndex: c.interview.currentQuestionIndex + 1,
                },
              };
              return updatedCandidate;
            }
            return c;
          }),
        }));
         if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      completeInterview: async (candidateId, summary, score) => {
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id === candidateId) {
              updatedCandidate = {
                  ...c,
                  interview: {
                    ...c.interview,
                    status: 'COMPLETED',
                    summary,
                    score,
                    endTime: Date.now(),
                  },
              };
              return updatedCandidate;
            }
            return c;
          }),
        }));
        
        if (updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }

        const token = get().activeToken;
        if (token) {
            try {
                // In a real app, this should be a Cloud Function for security.
                // For this prototype, we do it client-side.
                const tokensCollection = collection(firestore, 'interviewTokens');
                const q = query(tokensCollection, where('token', '==', token));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const tokenDocRef = querySnapshot.docs[0].ref;
                    await updateDoc(tokenDocRef, { isValid: false });
                    console.log(`Token ${token} invalidated.`);
                }
            } catch (error) {
                console.error("Error invalidating token: ", error);
            }
        }
      },
      getActiveCandidate: () => {
        const { candidates, activeCandidateId } = get();
        return candidates.find((c) => c.id === activeCandidateId) || null;
      },
      startOver: async (candidateId) => {
        let updatedCandidate: Candidate | undefined;
        set((state) => ({
          candidates: state.candidates.map((c) => {
             if (c.id === candidateId) {
                const email = c.email;
                const companyDomain = c.companyDomain;
                updatedCandidate = {
                  ...c,
                  name: '',
                  phone: '',
                  resumeFile: null,
                  interview: { ...initialInterviewRecord, status: 'COLLECTING_INFO' },
                  email, // preserve email and companyDomain
                  companyDomain,
                };
                return updatedCandidate;
             }
             return c;
          }),
        }));
        if(updatedCandidate) {
            await updateFirestoreCandidate(updatedCandidate);
        }
      },
      resetActiveCandidate: () => {
        set({ activeCandidateId: null, activeToken: null });
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
