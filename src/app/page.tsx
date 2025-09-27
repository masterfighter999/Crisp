// src/app/page.tsx
import { Header } from '@/components/header';
import { CandidateAuth } from '@/components/auth/candidate-auth';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <CandidateAuth />
      </main>
    </div>
  );
}
