import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@cuisine-du-monde.local' },
    update: {},
    create: {
      email: 'admin@cuisine-du-monde.local',
      password: hash,
    },
  });
  console.log('✅ Admin créé: admin@cuisine-du-monde.local / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
