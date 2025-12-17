import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 모든 레코드의 isCompleted를 false로 초기화하는 스크립트
 * 운동 완료는 WorkoutDay를 통해서만 관리됨
 */
async function main() {
  console.log('Resetting all records to incomplete...');
  
  const result = await prisma.record.updateMany({
    where: {
      isCompleted: true,
    },
    data: {
      isCompleted: false,
      completedAt: null,
    },
  });
  
  console.log(`Reset ${result.count} records to incomplete.`);
  
  // WorkoutDay도 모두 초기화 (선택사항)
  const workoutDayResult = await prisma.workoutDay.updateMany({
    where: {
      isCompleted: true,
    },
    data: {
      isCompleted: false,
      completedAt: null,
    },
  });
  
  console.log(`Reset ${workoutDayResult.count} workout days to incomplete.`);
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

