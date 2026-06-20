const prisma = require('../src/db');
const bcrypt = require('bcrypt');

async function main() {
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full access to all system features',
    },
  });

  await prisma.role.upsert({
    where: { name: 'SECONDARY_ADMIN' },
    update: {},
    create: {
      name: 'SECONDARY_ADMIN',
      description: 'Can create and update, but not delete or manage users',
    },
  });

  await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: {},
    create: {
      name: 'VIEWER',
      description: 'Read-only access to all information',
    },
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@luxissportscafe.com' },
    update: {},
    create: {
      name: 'Haseeb',
      email: 'admin@luxissportscafe.com',
      passwordHash,
      roleId: superAdminRole.id,
    },
  });


const arenas = [
    { name: 'Cricket Arena', sportType: 'CRICKET', hourlyRate: 2000 },
    { name: 'Futsal Court', sportType: 'FUTSAL', hourlyRate: 1500 },
    { name: 'Handball Court', sportType: 'HANDBALL', hourlyRate: 1200 },
    { name: 'Subsoccer Court', sportType: 'SUBSOCCER', hourlyRate: 1000 },
  ];

  for (const arena of arenas) {
    await prisma.arena.upsert({
      where: { name: arena.name },
      update: {},
      create: arena,
    });
  }

  console.log('Seed complete:', { role: superAdminRole.name, user: adminUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });