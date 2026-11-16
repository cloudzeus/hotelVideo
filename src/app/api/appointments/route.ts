import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Staff: list / create manager appointments (before / during / after a villa stay).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const appointments = await prisma.appointment.findMany({
    where: { companyId: user.companyId },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true } },
      guest: { select: { id: true, firstName: true, lastName: true, email: true } },
      villa: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });
  return NextResponse.json({ success: true, appointments });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const b = await request.json();
  if (!b.managerId || !b.title || !b.scheduledAt) {
    return NextResponse.json({ error: 'managerId, title and scheduledAt are required' }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      companyId: user.companyId,
      managerId: b.managerId,
      guestId: b.guestId ?? null,
      villaId: b.villaId ?? null,
      bookingId: b.bookingId ?? null,
      timing: b.timing ?? 'DURING',
      title: b.title,
      notes: b.notes ?? null,
      scheduledAt: new Date(b.scheduledAt),
      durationMin: b.durationMin ?? 30,
      status: b.status ?? 'CONFIRMED',
    },
  });
  return NextResponse.json({ success: true, appointment }, { status: 201 });
}
