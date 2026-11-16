import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVideoInvite } from '@/lib/video-invite';

// Creates an instant concierge video room and emails the contact a join link.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  if (!contact.email) return NextResponse.json({ error: 'Η επαφή δεν έχει email' }, { status: 400 });

  try {
    const { link } = await sendVideoInvite({
      email: contact.email,
      name: `${contact.firstName} ${contact.lastName}`.trim(),
      companyId: session.user.companyId,
      userId: session.user.id,
    });
    return NextResponse.json({ success: true, link });
  } catch (e) {
    console.error('video-invite email failed:', e);
    return NextResponse.json({ error: 'Η αποστολή email απέτυχε' }, { status: 502 });
  }
}
