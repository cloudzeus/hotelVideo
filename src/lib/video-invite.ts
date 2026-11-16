import { prisma } from '@/lib/prisma';
import { ensureRoom, newOnDemandRoomId } from '@/lib/rooms';
import { sendEmail } from '@/lib/email';

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

  const greeting = opts.name ? `Γεια σου ${opts.name},` : 'Γεια σου,';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#1c1917">Πρόσκληση σε βιντεοκλήση</h2>
      <p>${greeting} σε προσκαλούμε σε μια άμεση βιντεοκλήση με την ομάδα concierge του ${hotel}.</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${link}" style="background:#0078D4;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
          Σύνδεση στη βιντεοκλήση
        </a>
      </p>
      <p style="color:#78716c;font-size:13px">Ή άνοιξε τον σύνδεσμο: <a href="${link}">${link}</a></p>
    </div>`;

  await sendEmail(opts.email, `Πρόσκληση σε βιντεοκλήση — ${hotel}`, html, `Σύνδεσμος: ${link}`);
  return { link };
}
