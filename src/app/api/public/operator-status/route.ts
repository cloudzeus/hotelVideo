import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public (CORS-open) presence endpoint the hotel website polls to show an
// "operator online" badge. Reuses User.lastSeen (heartbeat every 60s).
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId') ?? undefined;
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);

  const operators = await prisma.user.findMany({
    where: {
      isActive: true,
      lastSeen: { gte: since },
      role: { in: ['Administrator', 'Manager', 'Employee'] },
      ...(companyId ? { companyId } : {}),
    },
    select: { id: true, firstName: true, lastName: true, avatar: true },
    take: 20,
  });

  return NextResponse.json(
    { online: operators.length > 0, count: operators.length, operators },
    { headers: CORS },
  );
}
