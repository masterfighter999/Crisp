// src/app/interview/page.tsx
'use client';
import { Header } from '@/components/header';
import { IntervieweeExperience } from '@/components/interviewee/interviewee-experience';
import { ClientOnly } from '@/components/client-only';
import withAuth from '@/components/auth/with-auth';

function InterviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ClientOnly>
          <IntervieweeExperience />
        </ClientOnly>
      </main>
    </div>
  );
}

export default withAuth(InterviewPage);
