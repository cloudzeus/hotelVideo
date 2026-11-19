import { NextRequest, NextResponse } from 'next/server';
import { getFreeSlots } from '@/lib/availability';

// Public (CORS-open): the hotel website asks for free 30-minute slots on a day so
// a guest can pick one when requesting a meeting.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  const date = request.nextUrl.searchParams.get('date'); // YYYY-MM-DD, service-tz day
  if (!companyId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'companyId and date=YYYY-MM-DD required' }, { status: 400, headers: CORS });
  }
  const slots = await getFreeSlots(companyId, date);
  return NextResponse.json({ date, slotMin: 30, slots }, { headers: CORS });
}
