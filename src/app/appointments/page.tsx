import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthSession } from '@/lib/auth';
import { getAppointments } from '@/lib/data/appointments';
import { prisma } from '@/lib/prisma';
import { Navigation } from '@/components/layout/navigation';
import { AppointmentsTable } from '@/components/appointments/appointments-table';
import { CreateAppointmentButton } from '@/components/appointments/create-appointment-button';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Appointments | hotelVideo' };

export default async function AppointmentsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/login');
  const companyId = session.user.companyId;

  const [rows, managers, villas, guests] = await Promise.all([
    getAppointments(companyId),
    prisma.user.findMany({ where: { companyId, isActive: true }, select: { id: true, firstName: true, lastName: true } }),
    prisma.villa.findMany({ where: { companyId, isActive: true }, select: { id: true, name: true } }),
    prisma.contact.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
  ]);

  return (
    <div className="min-h-screen bg-background app-shell">
      <Navigation user={session.user} />
      <main className="container-responsive py-6 pt-16 md:pt-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
              <p className="text-muted-foreground">Manager appointments before, during and after a villa stay.</p>
            </div>
            <CreateAppointmentButton
              managers={managers.map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName}` }))}
              villas={villas.map((v) => ({ id: v.id, label: v.name }))}
              guests={guests.map((g) => ({ id: g.id, label: `${g.firstName} ${g.lastName}` }))}
            />
          </div>
          <AppointmentsTable rows={rows} />
        </div>
      </main>
    </div>
  );
}
