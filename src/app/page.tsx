import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/header';
import { IntervieweeExperience } from '@/components/interviewee/interviewee-experience';
import { InterviewerView } from '@/components/interviewer/interviewer-view';
import { ClientOnly } from '@/components/client-only';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="interviewee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
            <TabsTrigger value="interviewee">Interviewee</TabsTrigger>
            <TabsTrigger value="interviewer">Interviewer</TabsTrigger>
          </TabsList>
          <TabsContent value="interviewee">
            <ClientOnly>
              <IntervieweeExperience />
            </ClientOnly>
          </TabsContent>
          <TabsContent value="interviewer">
            <ClientOnly>
              <InterviewerView />
            </ClientOnly>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
