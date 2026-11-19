import { prisma } from '@/lib/prisma';

// Admin-configured service hours, stored in the company's AppConfig.config JSON
// under `availability`. Slot length is fixed at 30 minutes. Times are local
// Europe/Athens "HH:mm". Day index 0=Sunday … 6=Saturday (JS getDay()).
export type DayAvailability = { enabled: boolean; start: string; end: string };
export type AvailabilityConfig = { slotMin: number; days: Record<number, DayAvailability> };

export const SERVICE_TZ = 'Europe/Athens';
export const SLOT_MIN = 30;

const WORK = { enabled: true, start: '09:00', end: '17:00' };
const OFF = { enabled: false, start: '09:00', end: '17:00' };

export const DEFAULT_AVAILABILITY: AvailabilityConfig = {
  slotMin: SLOT_MIN,
  days: { 0: { ...OFF }, 1: { ...WORK }, 2: { ...WORK }, 3: { ...WORK }, 4: { ...WORK }, 5: { ...WORK }, 6: { ...OFF } },
};

function activeCompanyId(explicit?: string): Promise<string | undefined> {
  if (explicit) return Promise.resolve(explicit);
  return prisma.company.findFirst({ where: { default: true }, select: { id: true } }).then((c) => c?.id);
}

export async function getAvailabilityConfig(companyId?: string): Promise<AvailabilityConfig> {
  try {
    const row = companyId
      ? await prisma.appConfig.findUnique({ where: { companyId } })
      : await prisma.appConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    const a = (row?.config as { availability?: AvailabilityConfig } | null)?.availability;
    if (a?.days) return { slotMin: SLOT_MIN, days: { ...DEFAULT_AVAILABILITY.days, ...a.days } };
  } catch {
    /* table may not exist yet */
  }
  return DEFAULT_AVAILABILITY;
}

// Read-modify-write so we never clobber the integration keys sharing this row.
export async function saveAvailabilityConfig(companyId: string, availability: AvailabilityConfig) {
  const existing = await prisma.appConfig.findUnique({ where: { companyId } });
  const merged = { ...((existing?.config as object) ?? {}), availability };
  return prisma.appConfig.upsert({
    where: { companyId },
    create: { companyId, config: merged },
    update: { config: merged },
  });
}

export { activeCompanyId };
