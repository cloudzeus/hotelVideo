import { prisma } from '../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

// Recovery: restore the default company to a clean state and (re)create the admin
// user on it, after the users table was emptied. Run: npx tsx prisma/fix-admin.ts
async function main() {
  const company =
    (await prisma.company.findFirst({ where: { default: true } })) ??
    (await prisma.company.findFirst());
  if (!company) return console.log('No company found.');

  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: 'Default Company', COMPANY: 'DEFAULT', type: 'Technology', default: true,
      AFM: null, CODE: null, address: null, city: null, country: null, ZIP: null,
      IRSDATA: null, JOBTYPE: null, PHONE01: null, phone: null,
    },
  });

  const password = await bcrypt.hash('1f1femsk', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'gkozyris@i4ria.com' },
    update: { password, role: 'Administrator', companyId: company.id, isActive: true },
    create: {
      email: 'gkozyris@i4ria.com', password, firstName: 'George', lastName: 'Kozyris',
      role: 'Administrator', companyId: company.id, isActive: true,
    },
  });

  console.log(`✅ Company restored to "Default Company"; admin ${admin.email} ready (pw: 1f1femsk).`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
