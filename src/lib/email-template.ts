// Email-client-safe branded HTML wrapper (table layout, inline styles only).
// Used for concierge invitations and other transactional mail.

export type BrandedEmailOptions = {
  hotel: string;
  logoUrl?: string;
  primary?: string; // hex
  preheader?: string; // hidden inbox preview line
  heading: string;
  bodyHtml: string; // paragraphs, already HTML-escaped by caller
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

export function renderBrandedEmail(opts: BrandedEmailOptions): { html: string; text: string } {
  const primary = opts.primary || '#0078D4';
  const hotel = escapeHtml(opts.hotel);
  const year = new Date().getFullYear();

  const logoCell = opts.logoUrl
    ? `<img src="${opts.logoUrl}" alt="${hotel}" height="34" style="height:34px;display:block;border:0;outline:none" />`
    : `<span style="font:600 18px/1.2 Arial,Helvetica,sans-serif;color:#ffffff;letter-spacing:.2px">${hotel}</span>`;

  const cta = opts.ctaUrl && opts.ctaLabel
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px"><tr>
         <td style="border-radius:8px;background:${primary}">
           <a href="${opts.ctaUrl}" target="_blank"
              style="display:inline-block;padding:14px 30px;font:600 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:8px">
             ${escapeHtml(opts.ctaLabel)}
           </a>
         </td></tr></table>`
    : '';

  const fallbackLink = opts.ctaUrl
    ? `<p style="margin:4px 0 0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#8a8f98;text-align:center">
         Αν το κουμπί δεν λειτουργεί, αντίγραψε τον σύνδεσμο:<br/>
         <a href="${opts.ctaUrl}" style="color:${primary};word-break:break-all">${escapeHtml(opts.ctaUrl)}</a>
       </p>`
    : '';

  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</div>`
    : '';

  const footerNote = opts.footerNote ? `${escapeHtml(opts.footerNote)}<br/>` : '';

  const html = `<!doctype html>
<html lang="el"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/><title>${hotel}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
      <tr><td style="background:${primary};padding:18px 28px">${logoCell}</td></tr>
      <tr><td style="padding:32px 28px 8px">
        <h1 style="margin:0 0 12px;font:700 22px/1.3 Arial,Helvetica,sans-serif;color:#15151c">${escapeHtml(opts.heading)}</h1>
        <div style="font:400 15px/1.65 Arial,Helvetica,sans-serif;color:#3f4651">${opts.bodyHtml}</div>
        ${cta}
        ${fallbackLink}
      </td></tr>
      <tr><td style="padding:24px 28px 28px">
        <hr style="border:none;border-top:1px solid #ececf0;margin:0 0 16px"/>
        <p style="margin:0;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#9aa0a8">
          ${footerNote}© ${year} ${hotel}. Concierge video.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const text = [
    opts.heading,
    '',
    opts.bodyHtml.replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim(),
    opts.ctaUrl ? `\n${opts.ctaLabel || 'Σύνδεσμος'}: ${opts.ctaUrl}` : '',
  ].join('\n').trim();

  return { html, text };
}
