import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthSession } from '@/lib/auth';
import { getServiceRequests } from '@/lib/data/service-requests';
import { Navigation } from '@/components/layout/navigation';
import { ServiceRequestsTable } from '@/components/service-requests/service-requests-table';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Service Requests | hotelVideo' };

export default async function ServiceRequestsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');

  const rows = await getServiceRequests(session.user.companyId);

  return (
    <div className="min-h-screen bg-background app-shell">
      <Navigation user={session.user} />
      <main className="container-responsive py-6 pt-16 md:pt-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
            <p className="text-muted-foreground">Guest requests captured from concierge video calls.</p>
          </div>
          <ServiceRequestsTable rows={rows} />
        </div>
      </main>
    </div>
  );
}
