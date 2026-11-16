import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureAppointmentRoom } from '@/lib/appointment-room';

const STATUSES = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const b = await request.json().catch(() => ({}));

  const existing = await prisma.appointment.findFirst({
    where: { id, companyId: session.user.companyId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (b.status && !STATUSES.includes(b.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(b.status ? { status: b.status } : {}),
      ...(b.scheduledAt ? { scheduledAt: new Date(b.scheduledAt) } : {}),
      ...(b.notes !== undefined ? { notes: b.notes } : {}),
      ...(b.managerId !== undefined ? { managerId: b.managerId || null } : {}),
    },
  });

  // Accepting a request mints + links the video room and emails the guest the
  // join link. Idempotent and best-effort — never fail the status change on it.
  let roomSlug: string | null = null;
  if (b.status === 'CONFIRMED') {
    try {
      ({ slug: roomSlug } = await ensureAppointmentRoom(id, session.user.id));
    } catch (e) {
      console.error('appointments PATCH: ensureAppointmentRoom failed', e);
    }
  }
  return NextResponse.json({ success: true, appointment: updated, roomSlug });
}
