import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureRoom, newOnDemandRoomId } from '@/lib/rooms';
import { sendEmail } from '@/lib/email';

// Creates an instant concierge video room and emails the contact a join link.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  if (!contact.email) return NextResponse.json({ error: 'Η επαφή δεν έχει email' }, { status: 400 });

  const companyId = session.user.companyId;
  const slug = newOnDemandRoomId('invite');
  await ensureRoom({
    streamCallId: slug,
    companyId,
    createdById: session.user.id,
    title: `Βιντεοκλήση με ${contact.firstName} ${contact.lastName}`,
  });

  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
  const hotel = company?.name || 'Ephyria';
  const link = `${base}/room/${slug}?name=${encodeURIComponent(hotel)}&companyId=${companyId}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#1c1917">Πρόσκληση σε βιντεοκλήση</h2>
      <p>Γεια σου ${contact.firstName}, σε προσκαλούμε σε μια άμεση βιντεοκλήση με την ομάδα concierge του ${hotel}.</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${link}" style="background:#0078D4;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
          Σύνδεση στη βιντεοκλήση
        </a>
      </p>
      <p style="color:#78716c;font-size:13px">Ή άνοιξε τον σύνδεσμο: <a href="${link}">${link}</a></p>
    </div>`;

  try {
    await sendEmail(contact.email, `Πρόσκληση σε βιντεοκλήση — ${hotel}`, html, `Σύνδεσμος: ${link}`);
  } catch (e) {
    console.error('video-invite email failed:', e);
    return NextResponse.json({ error: 'Η αποστολή email απέτυχε', link }, { status: 502 });
  }

  return NextResponse.json({ success: true, link });
}
