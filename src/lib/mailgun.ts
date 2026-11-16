// Mailgun HTTP API email sender (region-aware). Keys live in .env.local:
// MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_REGION (us|eu).
function base(): string {
  return process.env.MAILGUN_REGION === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
}
function authHeader(key: string): string {
  return 'Basic ' + Buffer.from(`api:${key}`).toString('base64');
}

export async function sendMailgunEmail(opts: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}): Promise<{ ok: boolean; status: number; id?: string }> {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key || !domain) {
    console.warn('Mailgun not configured — skipping send.');
    return { ok: false, status: 0 };
  }
  const body = new URLSearchParams();
  body.set('from', opts.from ?? process.env.MAILGUN_FROM ?? `concierge@${domain}`);
  (Array.isArray(opts.to) ? opts.to : [opts.to]).forEach((t) => body.append('to', t));
  body.set('subject', opts.subject);
  if (opts.text) body.set('text', opts.text);
  if (opts.html) body.set('html', opts.html);

  const res = await fetch(`${base()}/v3/${domain}/messages`, {
    method: 'POST',
    headers: { Authorization: authHeader(key), 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: res.ok, status: res.status, id: j.id };
}

// Validates the key/domain without sending (GET the domain resource).
export async function verifyMailgun(): Promise<{ ok: boolean; status: number; detail: string }> {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key || !domain) return { ok: false, status: 0, detail: 'MAILGUN_API_KEY/MAILGUN_DOMAIN missing' };
  const res = await fetch(`${base()}/v3/domains/${domain}`, { headers: { Authorization: authHeader(key) } });
  return { ok: res.ok, status: res.status, detail: res.ok ? 'Domain reachable' : 'Auth or domain check failed' };
}
