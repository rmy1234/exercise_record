import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // 자식 테이블부터 삭제 (Cascade 설정되어 있으면 부모만 지워도 되지만 명시적으로)
  // Cascade가 설정되어 있으므로 User만 지우면 됨.
  await prisma.user.deleteMany({});
  console.log('All users deleted.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

