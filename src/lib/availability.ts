import { prisma } from '@/lib/prisma';
import { getAvailabilityConfig, SERVICE_TZ, SLOT_MIN } from '@/lib/availability-config';

// Convert a wall-clock time in a timezone to the matching UTC Date (DST-safe).
export function zonedWallTimeToUtc(y: number, mo: number, d: number, h: number, mi: number, tz = SERVICE_TZ): Date {
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const inTz = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: tz }));
  const inUtc = new Date(new Date(asUtc).toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(asUtc - (inTz.getTime() - inUtc.getTime()));
}

// The wall-clock date (YYYY-MM-DD) and HH:mm of a UTC instant, in the service tz.
function tzParts(date: Date, tz = SERVICE_TZ): { date: string; minutes: number } {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const hm = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  const [h, m] = hm.split(':').map(Number);
  return { date: ymd, minutes: h! * 60 + m! };
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h! * 60 + m!;
};

/**
 * Free 30-minute slot start instants (UTC ISO) for `dateStr` (YYYY-MM-DD, read as
 * a service-tz calendar day), from the company's configured hours minus any slot
 * already taken by a REQUESTED/CONFIRMED appointment.
 */
export async function getFreeSlots(companyId: string, dateStr: string): Promise<string[]> {
  const cfg = await getAvailabilityConfig(companyId);
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return [];
  const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // 0..6, matches config keys
  const day = cfg.days[weekday];
  if (!day?.enabled) return [];

  const startMin = toMin(day.start);
  const endMin = toMin(day.end);
  if (endMin <= startMin) return [];

  // Appointments that already occupy a slot on this service-tz day.
  const dayStartUtc = zonedWallTimeToUtc(y, mo, d, 0, 0);
  const dayEndUtc = zonedWallTimeToUtc(y, mo, d + 1, 0, 0);
  const booked = await prisma.appointment.findMany({
    where: { companyId, status: { in: ['REQUESTED', 'CONFIRMED'] }, scheduledAt: { gte: dayStartUtc, lt: dayEndUtc } },
    select: { scheduledAt: true },
  });
  const takenMinutes = new Set(booked.map((b) => tzParts(b.scheduledAt).minutes));

  const slots: string[] = [];
  for (let m = startMin; m + SLOT_MIN <= endMin; m += SLOT_MIN) {
    if (takenMinutes.has(m)) continue;
    slots.push(zonedWallTimeToUtc(y, mo, d, Math.floor(m / 60), m % 60).toISOString());
  }
  return slots;
}
