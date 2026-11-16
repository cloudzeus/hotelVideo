import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getIntegrationConfig, type IntegrationConfig } from '@/lib/integration-config';

// Secret fields are masked on read and preserved when submitted blank.
const SECRETS: Record<keyof IntegrationConfig, string[]> = {
  stream: ['secret', 'webhookSecret'],
  bunny: ['accessKey'],
  openrouter: ['apiKey'],
  mailgun: ['apiKey'],
};
const mask = (v: string) => (v ? `••••${v.slice(-4)}` : '');

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized', status: 401 as const, session: null };
  if (session.user.role !== 'Administrator') return { error: 'Forbidden', status: 403 as const, session: null };
  return { error: null, status: 200 as const, session };
}

export async function GET() {
  const a = await requireAdmin();
  if (a.error) return NextResponse.json({ error: a.error }, { status: a.status });
  const cfg = await getIntegrationConfig();

  // return non-secrets in the clear, secrets masked with a "set" flag
  const view = {
    stream: { apiKey: cfg.stream.apiKey, publicKey: cfg.stream.publicKey, secret: mask(cfg.stream.secret), webhookSecret: mask(cfg.stream.webhookSecret), configured: !!(cfg.stream.apiKey && cfg.stream.secret) },
    bunny: { storageZone: cfg.bunny.storageZone, cdnUrl: cfg.bunny.cdnUrl, storageUrl: cfg.bunny.storageUrl, accessKey: mask(cfg.bunny.accessKey), configured: !!(cfg.bunny.accessKey && cfg.bunny.storageZone) },
    openrouter: { model: cfg.openrouter.model, apiKey: mask(cfg.openrouter.apiKey), configured: !!cfg.openrouter.apiKey },
    mailgun: { domain: cfg.mailgun.domain, from: cfg.mailgun.from, region: cfg.mailgun.region, apiKey: mask(cfg.mailgun.apiKey), configured: !!(cfg.mailgun.apiKey && cfg.mailgun.domain) },
  };
  return NextResponse.json(view);
}

export async function PUT(request: NextRequest) {
  const a = await requireAdmin();
  if (a.error || !a.session) return NextResponse.json({ error: a.error }, { status: a.status });
  const companyId = a.session.user.companyId;
  const body = (await request.json().catch(() => ({}))) as Partial<IntegrationConfig>;

  const existing = (await prisma.appConfig.findUnique({ where: { companyId } }))?.config as Partial<IntegrationConfig> | undefined;
  const merged: Partial<IntegrationConfig> = {};

  for (const group of Object.keys(SECRETS) as (keyof IntegrationConfig)[]) {
    const incoming = (body[group] ?? {}) as Record<string, string>;
    const prev = (existing?.[group] ?? {}) as Record<string, string>;
    const secretKeys = SECRETS[group];
    const out: Record<string, string> = { ...incoming };
    // blank secret → keep previously-stored value instead of wiping it
    for (const k of secretKeys) {
      if (!out[k] || !out[k].trim()) out[k] = prev[k] ?? '';
    }
    (merged as Record<string, unknown>)[group] = out;
  }

  await prisma.appConfig.upsert({
    where: { companyId },
    create: { companyId, config: merged as object },
    update: { config: merged as object },
  });
  return NextResponse.json({ success: true });
}
