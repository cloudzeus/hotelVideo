// Mailgun HTTP API email sender (region-aware). Config comes from the saved
// integration settings (DB) with .env.local as fallback.
import { getIntegrationConfig } from '@/lib/integration-config';

function baseFor(region: string): string {
  return region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
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
  const { mailgun: mg } = await getIntegrationConfig();
  const key = mg.apiKey;
  const domain = mg.domain;
  if (!key || !domain) {
    console.warn('Mailgun not configured — skipping send.');
    return { ok: false, status: 0 };
  }
  const body = new URLSearchParams();
  body.set('from', opts.from ?? mg.from ?? `concierge@${domain}`);
  (Array.isArray(opts.to) ? opts.to : [opts.to]).forEach((t) => body.append('to', t));
  body.set('subject', opts.subject);
  if (opts.text) body.set('text', opts.text);
  if (opts.html) body.set('html', opts.html);

  const res = await fetch(`${baseFor(mg.region)}/v3/${domain}/messages`, {
    method: 'POST',
    headers: { Authorization: authHeader(key), 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: res.ok, status: res.status, id: j.id };
}

// Validates the key/domain without sending (GET the domain resource).
export async function verifyMailgun(): Promise<{ ok: boolean; status: number; detail: string }> {
  const { mailgun: mg } = await getIntegrationConfig();
  if (!mg.apiKey || !mg.domain) return { ok: false, status: 0, detail: 'Mailgun API key / domain missing' };
  const res = await fetch(`${baseFor(mg.region)}/v3/domains/${mg.domain}`, { headers: { Authorization: authHeader(mg.apiKey) } });
  return { ok: res.ok, status: res.status, detail: res.ok ? 'Domain reachable' : 'Auth or domain check failed' };
}
