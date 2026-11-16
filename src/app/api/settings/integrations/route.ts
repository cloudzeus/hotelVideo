import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Env-backed config status (secrets masked). Values are edited in .env.local,
// mirroring the existing SMTP settings pattern.
const mask = (v?: string) => (v ? `••••${v.slice(-4)}` : null);

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'Administrator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json({
    stream: {
      configured: !!(process.env.STREAM_API_KEY && process.env.STREAM_SECRET),
      apiKey: process.env.STREAM_API_KEY ?? null,
      publicKey: process.env.NEXT_PUBLIC_STREAM_API_KEY ?? null,
      secret: mask(process.env.STREAM_SECRET),
      webhookSecret: mask(process.env.STREAM_WEBHOOK_SECRET),
    },
    bunny: {
      configured: !!(process.env.BUNNY_ACCESS_KEY && process.env.BUNNY_STORAGE_ZONE),
      storageZone: process.env.BUNNY_STORAGE_ZONE ?? null,
      cdnUrl: process.env.BUNNY_CDN_URL ?? null,
      storageUrl: process.env.BUNNY_STORAGE_URL ?? null,
      accessKey: mask(process.env.BUNNY_ACCESS_KEY),
    },
    openrouter: {
      configured: !!process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet',
      apiKey: mask(process.env.OPENROUTER_API_KEY),
    },
    mailgun: {
      configured: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
      domain: process.env.MAILGUN_DOMAIN ?? null,
      from: process.env.MAILGUN_FROM ?? null,
      region: process.env.MAILGUN_REGION ?? 'us',
      apiKey: mask(process.env.MAILGUN_API_KEY),
    },
  });
}
