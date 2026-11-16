import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const b = await request.json().catch(() => ({}));

  // scope to the staff member's company
  const existing = await prisma.serviceRequest.findFirst({
    where: { id, companyId: session.user.companyId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (b.status && !STATUSES.includes(b.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: {
      ...(b.status ? { status: b.status } : {}),
      ...(b.assigneeId !== undefined ? { assigneeId: b.assigneeId || null } : {}),
    },
  });
  return NextResponse.json({ success: true, serviceRequest: updated });
}
