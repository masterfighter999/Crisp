import { config } from 'dotenv';
config();

import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/summarize-candidate-performance.ts';
import '@/ai/flows/prompt-for-missing-information.ts';