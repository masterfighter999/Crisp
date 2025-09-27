// src/app/dashboard/page.tsx
'use client';
import { Header } from '@/components/header';
import { InterviewerView } from '@/components/interviewer/interviewer-view';
import { ClientOnly } from '@/components/client-only';
import withAuth from '@/components/auth/with-auth';

function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ClientOnly>
          <InterviewerView />
        </ClientOnly>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
