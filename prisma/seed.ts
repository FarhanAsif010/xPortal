import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin
  const adminHash = await bcrypt.hash('Admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@xportal.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@xportal.com',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Branch
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      name: 'Main Branch',
      location: '123 Exchange Street, City Center',
      isActive: true,
    },
  });
  console.log('✅ Branch created:', branch.name);

  // Teller
  const tellerHash = await bcrypt.hash('Teller123', 12);
  const teller = await prisma.user.upsert({
    where: { email: 'teller@xportal.com' },
    update: {},
    create: {
      name: 'Jane Teller',
      email: 'teller@xportal.com',
      passwordHash: tellerHash,
      role: 'TELLER',
      branchId: branch.id,
      isActive: true,
    },
  });
  console.log('✅ Teller created:', teller.email);

  // Exchange Rates (buyRate = how many foreign per USD when customer buys foreign)
  const currencies = [
    { code: 'EUR', buy: 0.92, sell: 0.928 },
    { code: 'GBP', buy: 0.785, sell: 0.792 },
    { code: 'JPY', buy: 149.5, sell: 150.2 },
    { code: 'CAD', buy: 1.36, sell: 1.368 },
    { code: 'AUD', buy: 1.52, sell: 1.529 },
    { code: 'CHF', buy: 0.895, sell: 0.902 },
    { code: 'CNY', buy: 7.24, sell: 7.28 },
    { code: 'INR', buy: 83.2, sell: 83.7 },
    { code: 'MXN', buy: 17.05, sell: 17.25 },
    { code: 'SGD', buy: 1.345, sell: 1.353 },
  ];

  for (const c of currencies) {
    await prisma.exchangeRate.upsert({
      where: { currencyCode: c.code },
      update: { buyRate: c.buy, sellRate: c.sell },
      create: {
        currencyCode: c.code,
        buyRate: c.buy,
        sellRate: c.sell,
        updatedById: admin.id,
      },
    });
  }
  console.log(`✅ ${currencies.length} exchange rates seeded`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
