import { prisma } from '@/lib/prisma';
import type { Call } from '@prisma/client';

// Villa 1 and Villa 2 are permanent, always-on concierge rooms with stable ids.
// Every other room is created on demand with a generated id.
export const PERMANENT_ROOM_SLUGS = ['villa-1', 'villa-2'] as const;
export type PermanentRoomSlug = (typeof PERMANENT_ROOM_SLUGS)[number];

export function isPermanentRoom(slug: string): slug is PermanentRoomSlug {
  return (PERMANENT_ROOM_SLUGS as readonly string[]).includes(slug);
}

/**
 * Returns the Call row that backs a room, keyed by its stable streamCallId.
 * Permanent rooms (villa-1/villa-2) reuse their fixed id; on-demand rooms pass
 * their own generated streamCallId.
 */
export async function ensureRoom(opts: {
  streamCallId: string;
  companyId: string;
  createdById: string;
  title: string;
  villaId?: string | null;
}): Promise<Call> {
  const existing = await prisma.call.findFirst({ where: { streamCallId: opts.streamCallId } });
  if (existing) return existing;
  return prisma.call.create({
    data: {
      title: opts.title,
      type: 'concierge',
      status: 'OPEN',
      startTime: new Date(),
      streamCallId: opts.streamCallId,
      companyId: opts.companyId,
      createdById: opts.createdById,
    },
  });
}

/** Generate an on-demand room id for a given villa (or ad-hoc concierge call). */
export function newOnDemandRoomId(prefix = 'room'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
