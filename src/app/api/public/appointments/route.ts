import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { renderBrandedEmail } from '@/lib/email-template';

// Public (CORS-open): a guest on the hotel website requests a concierge video
// meeting (before / during / after their stay) at a preferred date/time. Creates
// or links a Contact, then a REQUESTED Appointment (no manager yet — staff assign
// and confirm later). Sends a branded acknowledgement to the guest and a
// notification to the company's active operators.
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
  if (!b || !b.companyId || !b.scheduledAt || !b.guest?.firstName || !b.guest?.lastName) {
    return NextResponse.json(
      { error: 'companyId, scheduledAt and guest.{firstName,lastName} are required' },
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

  // website visitors don't know a manager; staff assign on confirm
  const appointment = await prisma.appointment.create({
    data: {
      company: { connect: { id: b.companyId } },
      ...(b.managerId ? { manager: { connect: { id: b.managerId } } } : {}),
      guest: { connect: { id: guest.id } },
      ...(b.villaId ? { villa: { connect: { id: b.villaId } } } : {}),
      timing: b.timing ?? 'DURING',
      title: b.title ?? 'Concierge video meeting request',
      notes: b.notes ?? null,
      scheduledAt: new Date(b.scheduledAt),
      durationMin: b.durationMin ?? 30,
      status: 'REQUESTED',
    },
  });

  // Best-effort transactional email (never fail the request on a mail error).
  try {
    await sendRequestEmails({
      companyId: b.companyId,
      locale: b.locale === 'en' ? 'en' : 'el',
      guestName: `${b.guest.firstName} ${b.guest.lastName}`.trim(),
      guestEmail: b.guest.email ?? null,
      guestPhone: b.guest.phone ?? null,
      scheduledAt: new Date(b.scheduledAt),
      notes: b.notes ?? null,
    });
  } catch (e) {
    console.error('public/appointments: request emails failed', e);
  }

  return NextResponse.json({ success: true, appointmentId: appointment.id }, { status: 201, headers: CORS });
}

async function sendRequestEmails(opts: {
  companyId: string;
  locale: 'el' | 'en';
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  scheduledAt: Date;
  notes: string | null;
}) {
  const company = await prisma.company.findUnique({ where: { id: opts.companyId }, select: { name: true } });
  const hotel = company?.name || 'Ephyria';
  const when = opts.scheduledAt.toLocaleString(opts.locale === 'en' ? 'en-GB' : 'el-GR');

  // 1) Guest acknowledgement (in the website's locale).
  if (opts.guestEmail) {
    const el = opts.locale === 'el';
    const greeting = el ? `Αγαπητέ/ή ${opts.guestName},` : `Dear ${opts.guestName},`;
    const { html, text } = renderBrandedEmail({
      hotel,
      preheader: el
        ? `Λάβαμε το αίτημά σας για βιντεοκλήση στις ${when}.`
        : `We received your video-meeting request for ${when}.`,
      heading: el ? 'Λάβαμε το αίτημά σας' : 'We received your request',
      bodyHtml: el
        ? `<p style="margin:0 0 12px">${greeting}</p>
           <p style="margin:0">Λάβαμε το αίτημά σας για βιντεοκλήση με το concierge στις <strong>${when}</strong>. Η ομάδα μας θα το επιβεβαιώσει σύντομα και θα σας στείλει τον σύνδεσμο σύνδεσης με email.</p>`
        : `<p style="margin:0 0 12px">${greeting}</p>
           <p style="margin:0">We received your concierge video-meeting request for <strong>${when}</strong>. Our team will confirm shortly and email you the join link.</p>`,
      footerNote: el
        ? 'Λάβατε αυτό το email επειδή ζητήσατε βιντεοκλήση με το concierge.'
        : 'You received this email because you requested a concierge video meeting.',
    });
    await sendEmail(
      opts.guestEmail,
      el ? `Λάβαμε το αίτημά σας για βιντεοκλήση — ${hotel}` : `We received your video-meeting request — ${hotel}`,
      html,
      text,
    );
  }

  // 2) Staff notification to the company's active operators (Greek — internal).
  const operators = await prisma.user.findMany({
    where: {
      companyId: opts.companyId,
      isActive: true,
      role: { in: ['Administrator', 'Manager', 'Employee'] },
    },
    select: { email: true },
    take: 20,
  });
  const to = operators.map((o) => o.email).filter((e): e is string => !!e);
  if (to.length > 0) {
    const details = [
      `Πελάτης: ${opts.guestName}`,
      opts.guestEmail ? `Email: ${opts.guestEmail}` : null,
      opts.guestPhone ? `Τηλέφωνο: ${opts.guestPhone}` : null,
      `Προτιμώμενη ώρα: ${when}`,
      opts.notes ? `Μήνυμα: ${opts.notes}` : null,
    ].filter(Boolean) as string[];
    const { html, text } = renderBrandedEmail({
      hotel,
      preheader: `Νέο αίτημα βιντεοκλήσης από ${opts.guestName}.`,
      heading: 'Νέο αίτημα βιντεοκλήσης',
      bodyHtml: `<p style="margin:0 0 12px">Νέο αίτημα βιντεοκλήσης από την ιστοσελίδα. Ανοίξτε τα «Ραντεβού» για να το αποδεχθείτε και να ορίσετε υπεύθυνο.</p>
        <p style="margin:0">${details.map((d) => `• ${d}`).join('<br>')}</p>`,
      footerNote: 'Εσωτερική ειδοποίηση concierge.',
    });
    // One message to all operators (small team).
    await sendEmail(to.join(', '), `Νέο αίτημα βιντεοκλήσης — ${opts.guestName}`, html, text);
  }
}
