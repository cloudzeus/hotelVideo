import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getIntegrationConfig } from '@/lib/integration-config';
import { generateStreamUserToken } from '@/lib/stream-token';

type Result = { ok: boolean; status: number; detail: string };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Administrator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { service } = await request.json().catch(() => ({ service: '' }));
  const cfg = await getIntegrationConfig();
  let r: Result;

  try {
    switch (service) {
      case 'stream': {
        if (cfg.stream.apiKey && cfg.stream.secret) {
          generateStreamUserToken('healthcheck', cfg.stream.apiKey, cfg.stream.secret); // throws if misconfigured
          r = { ok: true, status: 200, detail: 'API key + secret present' };
        } else {
          r = { ok: false, status: 0, detail: 'API key / secret missing' };
        }
        break;
      }
      case 'bunny': {
        const { storageZone, accessKey, storageUrl } = cfg.bunny;
        if (!storageZone || !accessKey) {
          r = { ok: false, status: 0, detail: 'Storage zone / access key missing' };
        } else {
          const res = await fetch(`${storageUrl || 'https://storage.bunnycdn.com'}/${storageZone}/`, { headers: { AccessKey: accessKey } });
          const ok = res.status === 200 || res.status === 404;
          r = { ok, status: res.status, detail: ok ? 'Storage zone reachable' : 'Auth failed (check access key)' };
        }
        break;
      }
      case 'openrouter': {
        if (!cfg.openrouter.apiKey) {
          r = { ok: false, status: 0, detail: 'API key missing' };
        } else {
          const res = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${cfg.openrouter.apiKey}` } });
          r = { ok: res.ok, status: res.status, detail: res.ok ? 'Key valid' : 'Key rejected' };
        }
        break;
      }
      case 'mailgun': {
        const { apiKey, domain, region } = cfg.mailgun;
        if (!apiKey || !domain) {
          r = { ok: false, status: 0, detail: 'API key / domain missing' };
        } else {
          const base = region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
          const res = await fetch(`${base}/v3/domains/${domain}`, { headers: { Authorization: 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64') } });
          r = { ok: res.ok, status: res.status, detail: res.ok ? 'Domain reachable' : 'Auth or domain failed' };
        }
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown service' }, { status: 400 });
    }
  } catch (e) {
    r = { ok: false, status: 0, detail: e instanceof Error ? e.message : 'Test failed' };
  }
  return NextResponse.json(r);
}
