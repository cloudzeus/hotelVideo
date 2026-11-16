import { prisma } from '@/lib/prisma';
import { ensureRoom, newOnDemandRoomId } from '@/lib/rooms';
import { sendEmail } from '@/lib/email';
import { renderBrandedEmail } from '@/lib/email-template';

/**
 * Ensures a (confirmed) appointment has a linked video room and returns its slug.
 * Mints an on-demand Call, links appointment.callId, assigns the staff member as
 * manager if none was set, and emails the guest the branded join link.
 * Idempotent: if a room is already linked it is reused and no email is re-sent.
 */
export async function ensureAppointmentRoom(
  appointmentId: string,
  staffUserId: string,
): Promise<{ slug: string | null }> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      guest: { select: { firstName: true, lastName: true, email: true } },
      call: { select: { streamCallId: true } },
      company: { select: { name: true } },
    },
  });
  if (!appt) return { slug: null };
  if (appt.call?.streamCallId) return { slug: appt.call.streamCallId }; // already minted

  const slug = newOnDemandRoomId('appt');
  const room = await ensureRoom({
    streamCallId: slug,
    companyId: appt.companyId,
    createdById: staffUserId,
    title: appt.title || 'Concierge video meeting',
  });
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { callId: room.id, managerId: appt.managerId ?? staffUserId },
  });

  // Email the guest the branded join link (best-effort: never block the confirm).
  const email = appt.guest?.email;
  if (email) {
    const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const hotel = appt.company?.name || 'Ephyria';
    const link = `${base}/room/${slug}?name=${encodeURIComponent(hotel)}&companyId=${appt.companyId}`;
    const name = (appt.guest?.firstName || '').trim();
    const when = new Date(appt.scheduledAt).toLocaleString('el-GR');
    const greeting = name ? `Αγαπητέ/ή ${name},` : 'Γεια σας,';
    const { html, text } = renderBrandedEmail({
      hotel,
      preheader: `Το ραντεβού βιντεοκλήσης σας επιβεβαιώθηκε για ${when}.`,
      heading: 'Το ραντεβού σας επιβεβαιώθηκε',
      bodyHtml: `<p style="margin:0 0 12px">${greeting}</p>
        <p style="margin:0 0 12px">Επιβεβαιώσαμε το ραντεβού βιντεοκλήσης σας για <strong>${when}</strong>. Την ώρα του ραντεβού πατήστε το κουμπί παρακάτω για να συνδεθείτε — δεν χρειάζεται εγκατάσταση ή λογαριασμός.</p>`,
      ctaLabel: 'Σύνδεση στη βιντεοκλήση',
      ctaUrl: link,
      footerNote: 'Λάβατε αυτό το email επειδή ζητήσατε ραντεβού βιντεοκλήσης με το concierge.',
    });
    try {
      await sendEmail(email, `Επιβεβαίωση ραντεβού βιντεοκλήσης — ${hotel}`, html, text);
    } catch (e) {
      console.error('ensureAppointmentRoom: confirmation email failed', e);
    }
  }
  return { slug };
}
