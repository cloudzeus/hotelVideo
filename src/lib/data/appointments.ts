import { prisma } from '@/lib/prisma';

export async function getAppointments(companyId: string) {
  return prisma.appointment.findMany({
    where: { companyId },
    include: {
      manager: { select: { firstName: true, lastName: true } },
      guest: { select: { firstName: true, lastName: true, email: true } },
      villa: { select: { name: true, slug: true } },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 200,
  });
}

export type AppointmentRow = Awaited<ReturnType<typeof getAppointments>>[number];
