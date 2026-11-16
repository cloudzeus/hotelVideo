import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateStreamUserToken } from '@/lib/stream-token';
import { verifyMailgun } from '@/lib/mailgun';

type Result = { ok: boolean; status: number; detail: string };

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Administrator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { service } = await request.json().catch(() => ({ service: '' }));
  let r: Result;

  try {
    switch (service) {
      case 'stream': {
        if (!process.env.STREAM_API_KEY || !process.env.STREAM_SECRET) {
          r = { ok: false, status: 0, detail: 'STREAM_API_KEY/STREAM_SECRET missing' };
        } else {
          generateStreamUserToken('healthcheck'); // throws if misconfigured
          r = { ok: true, status: 200, detail: 'Keys present, token minting works' };
        }
        break;
      }
      case 'bunny': {
        const zone = process.env.BUNNY_STORAGE_ZONE;
        const key = process.env.BUNNY_ACCESS_KEY;
        const url = `${process.env.BUNNY_STORAGE_URL ?? 'https://storage.bunnycdn.com'}/${zone}/`;
        if (!zone || !key) {
          r = { ok: false, status: 0, detail: 'BUNNY_STORAGE_ZONE/BUNNY_ACCESS_KEY missing' };
        } else {
          const res = await fetch(url, { headers: { AccessKey: key } });
          const ok = res.status === 200 || res.status === 404; // 404 = empty zone, auth still valid
          r = { ok, status: res.status, detail: ok ? 'Storage zone reachable' : 'Auth failed (check AccessKey)' };
        }
        break;
      }
      case 'openrouter': {
        const key = process.env.OPENROUTER_API_KEY;
        if (!key) {
          r = { ok: false, status: 0, detail: 'OPENROUTER_API_KEY missing' };
        } else {
          const res = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${key}` } });
          r = { ok: res.ok, status: res.status, detail: res.ok ? 'Key valid' : 'Key rejected' };
        }
        break;
      }
      case 'mailgun': {
        r = await verifyMailgun();
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
