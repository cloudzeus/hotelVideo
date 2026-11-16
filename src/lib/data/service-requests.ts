import { prisma } from '@/lib/prisma';

export async function getServiceRequests(companyId: string) {
  return prisma.serviceRequest.findMany({
    where: { companyId },
    include: {
      guest: { select: { firstName: true, lastName: true, email: true } },
      villa: { select: { name: true, slug: true } },
      assignee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
}

export type ServiceRequestRow = Awaited<ReturnType<typeof getServiceRequests>>[number];
