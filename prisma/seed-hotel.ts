import { prisma } from '../src/lib/prisma';
import { PERMANENT_ROOM_SLUGS, ensureRoom } from '../src/lib/rooms';

// Seeds the two permanent villas (Villa 1, Villa 2) and their always-on concierge
// rooms against the default company. Run after the base seed: npm run db:seed:hotel
async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, default: true } });
  const companyId = companies.find((c) => c.default)?.id ?? companies[0]?.id;
  if (!companyId) {
    console.log('⚠️  No company found — create a company first.');
    return;
  }
  const admin =
    (await prisma.user.findFirst({ where: { companyId, role: 'Administrator' }, select: { id: true } })) ??
    (await prisma.user.findFirst({ where: { companyId }, select: { id: true } }));
  if (!admin) {
    console.log('⚠️  No user found for company — create a user first.');
    return;
  }

  const hotelId: string = companyId;
  for (const [i, slug] of PERMANENT_ROOM_SLUGS.entries()) {
    const name = `Villa ${i + 1}`;
    const villa = await prisma.villa.upsert({
      where: { slug },
      update: { name, isActive: true },
      create: { slug, name, companyId: hotelId, isActive: true },
    });
    const room = await ensureRoom({
      streamCallId: slug,
      companyId: hotelId,
      createdById: admin.id,
      title: `${name} — Concierge`,
      villaId: villa.id,
    });
    console.log(`✅ ${name}: villa=${villa.id} room=${room.streamCallId}`);
  }
  console.log('🏨 Permanent villas seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
