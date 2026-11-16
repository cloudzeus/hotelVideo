import { prisma } from '../src/lib/prisma';

// Demo data so the screens have something to show. Idempotent-ish: clears demo
// rows (by a marker) then re-creates. Run: npx tsx prisma/seed-demo.ts
async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, default: true } });
  const companyId = companies.find((c) => c.default)?.id ?? companies[0]?.id;
  if (!companyId) return console.log('No company found.');
  const admin = await prisma.user.findFirst({ where: { companyId }, select: { id: true } });
  if (!admin) return console.log('No user found.');
  const villas = await prisma.villa.findMany({ where: { companyId }, select: { id: true, name: true } });
  if (villas.length === 0) return console.log('Run db:seed:hotel first (no villas).');
  const villa = (i: number) => villas[i % villas.length]!.id;

  // wipe previous demo rows
  await prisma.serviceRequest.deleteMany({ where: { companyId, title: { startsWith: '[demo] ' } } });
  await prisma.appointment.deleteMany({ where: { companyId, title: { startsWith: '[demo] ' } } });
  await prisma.booking.deleteMany({ where: { companyId, reference: { startsWith: 'DEMO-' } } });
  await prisma.contact.deleteMany({ where: { email: { endsWith: '@demo.ephyria' } } });

  // guests
  const guestsData: [string, string, string, string][] = [
    ['Maria', 'Rossi', 'maria.rossi@demo.ephyria', '+39 333 100200'],
    ['James', 'Carter', 'james.carter@demo.ephyria', '+44 7700 900123'],
    ['Lena', 'Virtanen', 'lena.virtanen@demo.ephyria', '+358 40 1234567'],
    ['Omar', 'Haddad', 'omar.haddad@demo.ephyria', '+971 50 7654321'],
  ];
  const guests = [];
  for (const [firstName, lastName, email, phone] of guestsData) {
    guests.push(await prisma.contact.create({ data: { firstName, lastName, email, phone } }));
  }

  const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

  // bookings
  const bookings = [];
  for (let i = 0; i < guests.length; i++) {
    bookings.push(await prisma.booking.create({
      data: {
        companyId, villaId: villa(i), guestId: guests[i]!.id,
        reference: `DEMO-${1000 + i}`,
        checkIn: daysFromNow(-3 + i * 2), checkOut: daysFromNow(4 + i * 2),
        status: (['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CONFIRMED'] as const)[i],
      },
    }));
  }

  // service requests
  const reqs: [string, string, any, any][] = [
    ['[demo] Extra towels & beach set', 'Guest asked for 4 beach towels and 2 pool floats delivered to the villa.', 'HOUSEKEEPING', 'OPEN'],
    ['[demo] AC not cooling in master bedroom', 'Unit blows warm air; guest requests a technician this afternoon.', 'MAINTENANCE', 'IN_PROGRESS'],
    ['[demo] Private chef — dinner for 6', 'Mediterranean menu, one vegetarian, 20:30 tonight.', 'FOOD_BEVERAGE', 'OPEN'],
    ['[demo] Airport transfer Sunday 11:00', 'Pickup for 4 pax + luggage to the airport.', 'TRANSPORT', 'RESOLVED'],
    ['[demo] Boat day recommendation', 'Guest wants a half-day private boat with skipper.', 'CONCIERGE', 'OPEN'],
    ['[demo] Late checkout request', 'Asked to keep the villa until 16:00 on departure.', 'OTHER', 'RESOLVED'],
  ];
  for (let i = 0; i < reqs.length; i++) {
    const [title, body, category, status] = reqs[i]!;
    await prisma.serviceRequest.create({
      data: {
        companyId, villaId: villa(i), guestId: guests[i % guests.length]!.id,
        source: 'VIDEO', category, status, title, body,
        createdAt: daysFromNow(-(i % 10)),
      },
    });
  }

  // appointments (before / during / after)
  const appts: [string, any, any, number][] = [
    ['[demo] Pre-arrival concierge call', 'BEFORE', 'CONFIRMED', -1],
    ['[demo] In-stay check-in with manager', 'DURING', 'CONFIRMED', 1],
    ['[demo] Villa walkthrough', 'DURING', 'REQUESTED', 2],
    ['[demo] Post-stay feedback call', 'AFTER', 'REQUESTED', 6],
    ['[demo] Pre-arrival preferences', 'BEFORE', 'COMPLETED', -4],
  ];
  for (let i = 0; i < appts.length; i++) {
    const [title, timing, status, offset] = appts[i]!;
    const at = daysFromNow(offset); at.setHours(10 + i, 0, 0, 0);
    await prisma.appointment.create({
      data: {
        companyId, managerId: admin.id, guestId: guests[i % guests.length]!.id, villaId: villa(i),
        bookingId: bookings[i % bookings.length]!.id,
        timing, status, title, scheduledAt: at, durationMin: 30,
        notes: 'Demo appointment.',
      },
    });
  }

  // calls over the last 14 days (feeds the sessions chart)
  await prisma.call.deleteMany({ where: { companyId, title: { startsWith: '[demo] Session' } } });
  const pattern = [1, 0, 2, 1, 0, 3, 2, 1, 0, 2, 4, 1, 3, 2];
  for (let d = 0; d < pattern.length; d++) {
    for (let k = 0; k < pattern[d]!; k++) {
      const st = daysFromNow(-(13 - d)); st.setHours(9 + k, 0, 0, 0);
      await prisma.call.create({
        data: { companyId, createdById: admin.id, title: `[demo] Session ${d}-${k}`, type: 'concierge', status: 'COMPLETED', startTime: st, endTime: new Date(st.getTime() + 20 * 60000) },
      });
    }
  }

  console.log(`✅ Demo seeded: ${guests.length} guests, ${bookings.length} bookings, ${reqs.length} requests, ${appts.length} appointments, ${pattern.reduce((a, b) => a + b, 0)} calls.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
