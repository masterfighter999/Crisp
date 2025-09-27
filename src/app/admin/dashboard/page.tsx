// src/app/admin/dashboard/page.tsx
'use client';
import { Header } from '@/components/header';
import { ClientOnly } from '@/components/client-only';
import withAuth from '@/components/auth/with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ClientOnly>
           <Card>
                <CardHeader className="text-center">
                     <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                        <ShieldCheck className="size-10 text-primary" />
                    </div>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>Welcome, administrator.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        This area is restricted. You can add admin-specific components here.
                    </p>
                </CardContent>
           </Card>
        </ClientOnly>
      </main>
    </div>
  );
}

export default withAuth(AdminDashboardPage);