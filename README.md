# Crisp

Crisp is a web application designed to streamline the technical screening process. It uses AI to conduct automated interviews with candidates, evaluate their performance, and provide detailed feedback to recruiters and hiring managers.

## Live Demo

[View the live deployment here](https://ai-interview-ace.vercel.app/)

## Key Features

### For Candidates
- **AI-Powered Interviews**: Engage in an automated chat-based technical interview.
- **Resume Parsing**: Upload a resume to automatically fill in personal details.
- **Performance Summary**: Receive an AI-generated score and a detailed summary of your performance immediately after the interview.
- **Personal Dashboard**: Log in to view a history of your past interview results.
- **Guest Access**: Start an interview quickly using a unique token provided by an interviewer, without needing to create an account.

### For Interviewers
- **Candidate Management**: View a dashboard of all candidates who have completed interviews for your organization.
- **Detailed Analytics**: Dive into a candidate's full interview transcript, AI-generated summary, and final score.
- **Token Generation**: Generate unique, single-use interview tokens for candidates, either individually or in bulk by uploading an XLSX file.
- **Secure Access**: Interviewer access is restricted to users with email addresses from allowed corporate domains.

### For Administrators
- **Domain Management**: A special admin dashboard to manage which email domains are permitted to have interviewer access.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with ShadCN UI components
- **AI/Generative**: Google's Gemini via Genkit
- **Authentication**: Firebase Authentication (Email/Password & Anonymous)
- **Database**: Firestore for storing interview data, questions, and user roles.
- **State Management**: Zustand

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn

### 1. Set Up Environment Variables

The application requires a Gemini API key to power its AI features.

1.  **Create a Gemini API Key**:
    - Go to [Google AI Studio](https://makersuite.google.com/app/apikey).
    - Click **Create API key** and copy the generated key.

2.  **Configure Environment File**:
    - In the root of the project, you will find a `.env` file.
    - Open the file and replace the placeholder with your actual key:
      ```
      GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
      ```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## Project Structure

- `src/app/`: Contains all the pages for the application, following the Next.js App Router structure.
- `src/components/`: Reusable React components, organized by feature (e.g., `interviewer`, `interviewee`, `ui`).
- `src/ai/`: Holds all the Genkit code, including AI flows for generating questions and summarizing performance.
- `src/lib/`: Includes utility functions, Firebase configuration (`firebase.ts`), global state management (`store.ts`), and type definitions (`types.ts`).
- `src/context/`: Contains the React context for authentication (`auth-context.tsx`).
- `firestore.rules`: Defines the security rules for the Firestore database.
