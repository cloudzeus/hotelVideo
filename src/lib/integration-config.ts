import { prisma } from '@/lib/prisma';

export type IntegrationConfig = {
  stream: { apiKey: string; secret: string; publicKey: string; webhookSecret: string };
  bunny: { accessKey: string; storageZone: string; cdnUrl: string; storageUrl: string };
  openrouter: { apiKey: string; model: string };
  mailgun: { apiKey: string; domain: string; from: string; region: string };
};

function envConfig(): IntegrationConfig {
  return {
    stream: {
      apiKey: process.env.STREAM_API_KEY ?? '',
      secret: process.env.STREAM_SECRET ?? '',
      publicKey: process.env.NEXT_PUBLIC_STREAM_API_KEY ?? '',
      webhookSecret: process.env.STREAM_WEBHOOK_SECRET ?? '',
    },
    bunny: {
      accessKey: process.env.BUNNY_ACCESS_KEY ?? '',
      storageZone: process.env.BUNNY_STORAGE_ZONE ?? '',
      cdnUrl: process.env.BUNNY_CDN_URL ?? '',
      storageUrl: process.env.BUNNY_STORAGE_URL ?? '',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY ?? '',
      model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet',
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY ?? '',
      domain: process.env.MAILGUN_DOMAIN ?? '',
      from: process.env.MAILGUN_FROM ?? '',
      region: process.env.MAILGUN_REGION ?? 'us',
    },
  };
}

// a stored (non-empty) value overrides env; blanks fall back to env
function overlay<T extends Record<string, string>>(base: T, over: Partial<T> | undefined): T {
  const out = { ...base };
  if (over) for (const k in over) {
    const v = over[k];
    if (typeof v === 'string' && v.trim()) (out as Record<string, string>)[k] = v;
  }
  return out;
}

/** Effective integration config: env defaults overlaid with DB-saved values. */
export async function getIntegrationConfig(): Promise<IntegrationConfig> {
  const base = envConfig();
  let db: Partial<IntegrationConfig> = {};
  try {
    const row = await prisma.appConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    db = (row?.config as Partial<IntegrationConfig>) ?? {};
  } catch {
    /* table may not exist yet */
  }
  return {
    stream: overlay(base.stream, db.stream),
    bunny: overlay(base.bunny, db.bunny),
    openrouter: overlay(base.openrouter, db.openrouter),
    mailgun: overlay(base.mailgun, db.mailgun),
  };
}

export async function saveIntegrationConfig(companyId: string, config: Partial<IntegrationConfig>) {
  return prisma.appConfig.upsert({
    where: { companyId },
    create: { companyId, config: config as object },
    update: { config: config as object },
  });
}
