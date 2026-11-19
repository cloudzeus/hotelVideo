import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAvailabilityConfig, saveAvailabilityConfig, SLOT_MIN, type AvailabilityConfig } from '@/lib/availability-config';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ availability: await getAvailabilityConfig() });
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Administrator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const days = body?.days as AvailabilityConfig['days'] | undefined;
  if (!days || typeof days !== 'object') return NextResponse.json({ error: 'days required' }, { status: 400 });
  for (let d = 0; d < 7; d++) {
    const v = days[d];
    if (!v || typeof v.enabled !== 'boolean' || !HHMM.test(v.start) || !HHMM.test(v.end)) {
      return NextResponse.json({ error: `Μη έγκυρες ώρες για ημέρα ${d}` }, { status: 400 });
    }
    if (v.enabled && v.end <= v.start) {
      return NextResponse.json({ error: `Η ώρα λήξης πρέπει να είναι μετά την έναρξη (ημέρα ${d})` }, { status: 400 });
    }
  }

  const company = await prisma.company.findFirst({ where: { default: true }, select: { id: true } });
  if (!company) return NextResponse.json({ error: 'Δεν υπάρχει προεπιλεγμένη εταιρία' }, { status: 400 });

  await saveAvailabilityConfig(company.id, { slotMin: SLOT_MIN, days });
  return NextResponse.json({ success: true, availability: await getAvailabilityConfig(company.id) });
}
