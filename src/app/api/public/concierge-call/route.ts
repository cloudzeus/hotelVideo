import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public (CORS-open): a guest clicked "video call now" on the hotel website and is
// entering the always-on /room/reception. There is no push-alert yet, so we drop a
// staff-visible signal: an OPEN ServiceRequest (CONCIERGE) that shows on the staff
// Service Requests screen as "guest waiting in reception". Staff watch the dashboard.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  const b = await request.json().catch(() => null);
  if (!b || !b.companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400, headers: CORS });
  }

  const name = [b.guest?.firstName, b.guest?.lastName].filter(Boolean).join(' ').trim();
  const sr = await prisma.serviceRequest.create({
    data: {
      companyId: b.companyId,
      source: 'VIDEO',
      category: 'CONCIERGE',
      status: 'OPEN',
      title: name ? `Επισκέπτης στο reception: ${name}` : 'Επισκέπτης περιμένει στο reception',
      body:
        (b.message ? `${b.message}\n\n` : '') +
        `Ένας επισκέπτης άνοιξε τη βιντεοκλήση reception από την ιστοσελίδα${name ? ` (${name})` : ''}. Συνδεθείτε στο δωμάτιο /room/reception.`,
    },
  });

  return NextResponse.json({ success: true, serviceRequestId: sr.id }, { status: 201, headers: CORS });
}
