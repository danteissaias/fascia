import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const users = [
  { email: 'john@doe.com', name: 'John Doe' },
  { email: 'robert@roe.com', name: 'Robert Roe' },
  { email: 'dante@issaias.com', name: 'Dante Issaias' },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
