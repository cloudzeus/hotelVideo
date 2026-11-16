import { prisma } from '../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

// Recovery: (re)create the admin user on the default/first company after the
// users table was emptied. Run: npx tsx prisma/fix-admin.ts
// NOTE: this NEVER modifies company details — only ensures the admin user exists.
async function main() {
  const company =
    (await prisma.company.findFirst({ where: { default: true } })) ??
    (await prisma.company.findFirst());
  if (!company) return console.log('No company found.');
  if (!company.default) {
    await prisma.company.update({ where: { id: company.id }, data: { default: true } });
  }

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
