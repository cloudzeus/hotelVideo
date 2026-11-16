import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthSession } from '@/lib/auth';
import { getAppointments } from '@/lib/data/appointments';
import { Navigation } from '@/components/layout/navigation';
import { AppointmentsTable } from '@/components/appointments/appointments-table';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Appointments | hotelVideo' };

export default async function AppointmentsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');

  const rows = await getAppointments(session.user.companyId);

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={session.user} />
      <main className="container-responsive py-6 pt-24">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">Manager appointments before, during and after a villa stay.</p>
          </div>
          <AppointmentsTable rows={rows} />
        </div>
      </main>
    </div>
  );
}
