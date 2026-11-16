import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateStreamUserToken } from '@/lib/stream-token';
import { getIntegrationConfig } from '@/lib/integration-config';
import { isPermanentRoom } from '@/lib/rooms';

// Public (CORS-open): a website guest gets a short-lived Stream token to join a
// concierge room. Permanent rooms (villa-1/villa-2) are always joinable; other
// slugs must correspond to an existing Villa or Call.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === 'string' ? body.slug : '';
  const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Guest';
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400, headers: CORS });

  if (!isPermanentRoom(slug)) {
    const exists =
      (await prisma.villa.findUnique({ where: { slug }, select: { id: true } })) ??
      (await prisma.call.findFirst({ where: { streamCallId: slug }, select: { id: true } }));
    if (!exists) return NextResponse.json({ error: 'room not found' }, { status: 404, headers: CORS });
  }

  const { stream } = await getIntegrationConfig();
  if (!stream.apiKey || !stream.secret) {
    return NextResponse.json({ error: 'Stream not configured' }, { status: 500, headers: CORS });
  }

  const userId = `guest-${Math.random().toString(36).slice(2, 10)}`;
  try {
    const token = generateStreamUserToken(userId, stream.apiKey, stream.secret);
    return NextResponse.json(
      { apiKey: stream.publicKey || stream.apiKey, token, userId, userName: name, callId: slug },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ error: 'Stream not configured' }, { status: 500, headers: CORS });
  }
}
