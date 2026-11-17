import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Pending items the staff dashboard polls to alert on: new guest meeting
// requests (REQUESTED appointments) and guests waiting in reception (OPEN
// CONCIERGE service requests), scoped to the signed-in user's company.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companyId = session.user.companyId;

  const [appointments, concierge] = await Promise.all([
    prisma.appointment.findMany({
      where: { companyId, status: 'REQUESTED' },
      select: { id: true, createdAt: true, scheduledAt: true, guest: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.serviceRequest.findMany({
      where: { companyId, status: 'OPEN', category: 'CONCIERGE' },
      select: { id: true, createdAt: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return NextResponse.json(
    {
      appointments: appointments.map((a) => ({
        id: a.id,
        createdAt: a.createdAt,
        scheduledAt: a.scheduledAt,
        guest: `${a.guest?.firstName ?? ''} ${a.guest?.lastName ?? ''}`.trim(),
      })),
      concierge: concierge.map((s) => ({ id: s.id, createdAt: s.createdAt, title: s.title })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
