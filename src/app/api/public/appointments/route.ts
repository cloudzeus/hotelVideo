import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public (CORS-open): a guest on the hotel website requests an appointment with a
// hotel manager before / during / after their stay. Creates/links a Contact, then
// a REQUESTED Appointment for staff to confirm.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  const b = await request.json().catch(() => null);
  if (!b || !b.companyId || !b.managerId || !b.scheduledAt || !b.guest?.firstName || !b.guest?.lastName) {
    return NextResponse.json(
      { error: 'companyId, managerId, scheduledAt and guest.{firstName,lastName} are required' },
      { status: 400, headers: CORS },
    );
  }

  // Link an existing contact by email, else create one.
  let guest = b.guest.email
    ? await prisma.contact.findFirst({ where: { email: b.guest.email } })
    : null;
  if (!guest) {
    guest = await prisma.contact.create({
      data: {
        firstName: b.guest.firstName,
        lastName: b.guest.lastName,
        email: b.guest.email ?? null,
        phone: b.guest.phone ?? null,
      },
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      companyId: b.companyId,
      managerId: b.managerId,
      guestId: guest.id,
      villaId: b.villaId ?? null,
      timing: b.timing ?? 'DURING',
      title: b.title ?? 'Manager appointment request',
      notes: b.notes ?? null,
      scheduledAt: new Date(b.scheduledAt),
      durationMin: b.durationMin ?? 30,
      status: 'REQUESTED',
    },
  });

  return NextResponse.json({ success: true, appointmentId: appointment.id }, { status: 201, headers: CORS });
}
