import { prisma } from '@/lib/prisma';
import { ensureRoom, newOnDemandRoomId } from '@/lib/rooms';
import { sendEmail } from '@/lib/email';
import { renderBrandedEmail } from '@/lib/email-template';

/**
 * Creates an on-demand concierge room and emails `email` a join link for it.
 * Shared by the contact-row action and the ad-hoc "invite any email" form.
 */
export async function sendVideoInvite(opts: {
  email: string;
  name: string;
  companyId: string;
  userId: string;
}): Promise<{ link: string }> {
  const slug = newOnDemandRoomId('invite');
  await ensureRoom({
    streamCallId: slug,
    companyId: opts.companyId,
    createdById: opts.userId,
    title: `Βιντεοκλήση με ${opts.name || opts.email}`,
  });

  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const company = await prisma.company.findUnique({ where: { id: opts.companyId }, select: { name: true } });
  const hotel = company?.name || 'Ephyria';
  const link = `${base}/room/${slug}?name=${encodeURIComponent(hotel)}&companyId=${opts.companyId}`;

  const greeting = opts.name ? `Αγαπητέ/ή ${opts.name},` : 'Γεια σου,';
  const { html, text } = renderBrandedEmail({
    hotel,
    preheader: `Η ομάδα concierge του ${hotel} σε προσκαλεί σε βιντεοκλήση.`,
    heading: 'Πρόσκληση σε βιντεοκλήση',
    bodyHtml: `<p style="margin:0 0 12px">${greeting}</p>
      <p style="margin:0">Η ομάδα <strong>concierge</strong> του ${hotel} σε προσκαλεί σε μια άμεση βιντεοκλήση. Πάτησε το κουμπί παρακάτω όποτε είσαι έτοιμος/η — δεν χρειάζεται εγκατάσταση ή λογαριασμός.</p>`,
    ctaLabel: 'Σύνδεση στη βιντεοκλήση',
    ctaUrl: link,
    footerNote: 'Έλαβες αυτό το email επειδή ζητήθηκε βιντεοκλήση με το concierge.',
  });

  await sendEmail(opts.email, `Πρόσκληση σε βιντεοκλήση — ${hotel}`, html, text);
  return { link };
}
