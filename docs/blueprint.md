# **App Name**: AI Interview Ace

## Core Features:

- Resume Upload and Extraction: Allow candidates to upload their resume (PDF, DOCX). Extract name, email, and phone number using resume parsing libraries. Handle invalid files with error messages.
- Missing Field Prompt: If resume extraction fails, or if a field is missing, the chatbot will prompt the candidate to provide the missing information before starting the interview.
- Dynamic Question Generation: AI tool will generate coding interview questions dynamically based on difficulty levels (Easy, Medium, Hard) and topic: full stack (React/Node)
- Timed Interview Flow: Presents questions one at a time in a chat interface with predefined timers for each difficulty level (Easy: 20s, Medium: 60s, Hard: 120s). Automatically submits the answer when the timer runs out and advances to the next question.
- AI Scoring and Summary: After the interview (6 questions), AI tool calculates a final score and generates a summary of the candidate's performance, to be persisted locally.
- Interviewer Dashboard: Provides a dashboard to view all candidates, their scores, and summaries. Enables detailed views of each candidate's chat history, questions, answers, and scores.
- Data Persistence: Uses local storage (e.g., redux-persist, IndexedDB) to persist all timers, answers, and progress. A "Welcome Back" modal is displayed for unfinished sessions.

## Style Guidelines:

- Primary color: Deep sky blue (#3498db) for a calm, professional, reliable, and intelligent feel.
- Background color: Light gray (#ecf0f1) for a clean and modern look.
- Accent color: Orange (#e67e22) for highlighting important elements such as CTAs or timer bars. 
- Body and headline font: 'Inter' sans-serif for a clean, modern, objective, neutral look for both headers and body text. 
- Use simple and clear icons from a library like Ant Design Icons, related to user actions and interview progress.
- Maintain a clean, organized layout with clear separation of elements on both the Interviewee and Interviewer tabs. Use a responsive design to ensure the app functions well on various screen sizes.
- Subtle animations for loading states, transitions between questions, and progress updates to improve user engagement without being distracting.