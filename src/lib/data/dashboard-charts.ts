import { prisma } from '@/lib/prisma';

const CATEGORY_LABELS: Record<string, string> = {
  HOUSEKEEPING: 'Housekeeping',
  MAINTENANCE: 'Maintenance',
  FOOD_BEVERAGE: 'Food & Beverage',
  TRANSPORT: 'Transport',
  CONCIERGE: 'Concierge',
  OTHER: 'Other',
};

export type DashboardCharts = {
  callsPerDay: { date: string; label: string; calls: number }[];
  requestsByCategory: { category: string; count: number }[];
  appointmentsByStage: { stage: string; count: number }[];
};

export async function getDashboardCharts(companyId: string): Promise<DashboardCharts> {
  const days = 14;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const [calls, requests, appts] = await Promise.all([
    prisma.call.findMany({ where: { companyId, startTime: { gte: start } }, select: { startTime: true } }),
    prisma.serviceRequest.groupBy({ by: ['category'], where: { companyId }, _count: { _all: true } }),
    prisma.appointment.groupBy({ by: ['timing'], where: { companyId }, _count: { _all: true } }),
  ]);

  // bucket calls into the last `days` days (local date keys, TZ-consistent)
  const localKey = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(localKey(d), 0);
  }
  for (const c of calls) {
    const key = localKey(new Date(c.startTime));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const callsPerDay = [...buckets.entries()].map(([date, count]) => ({
    date,
    label: new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    calls: count,
  }));

  const requestsByCategory = requests
    .map((r) => ({ category: CATEGORY_LABELS[r.category] ?? r.category, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  const appointmentsByStage = ['BEFORE', 'DURING', 'AFTER'].map((stage) => ({
    stage: stage[0] + stage.slice(1).toLowerCase(),
    count: appts.find((a) => a.timing === stage)?._count._all ?? 0,
  }));

  return { callsPerDay, requestsByCategory, appointmentsByStage };
}
