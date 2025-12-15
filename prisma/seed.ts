import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EXERCISES = {
  가슴: [
    '벤치프레스',
    '인클라인 덤벨 프레스',
    '덤벨 체스트 프레스',
    '딥스',
    '푸시업',
    '케이블 크로스오버',
    '체스트 프레스 머신',
    '체스트 플라이',
    '인클라인 벤치프레스',
  ],
  등: [
    '랫풀다운',
    '바벨 로우',
    '덤벨 로우',
    '시티드 로우',
    '풀업',
    'T-바 로우',
    '암 풀다운',
  ],
  팔: [
    '바벨 컬',
    '덤벨 컬',
    '해머 컬',
    '프리처 컬',
    '케이블 컬',
    '라잉 트라이셉스 익스텐션',
    '케이블 푸시다운',
    '케이블 오버헤드 익스텐션',
    '클로즈그립 벤치프레스',
  ],
  어깨: [
    '숄더 프레스',
    '덤벨 숄더 프레스',
    '사이드 레터럴 레이즈',
    '프론트 레이즈',
    '리어 델트 플라이',
    '오버헤드 프레스',
    '업라이트 로우',
  ],
  하체: [
    '스쿼트',
    '레그 프레스',
    '런지',
    '레그 익스텐션',
    '레그 컬',
    '데드리프트',
    '카프 레이즈',
    '힙 쓰러스트',
    '불가리안 스쿼트',
    '핵 스쿼트',
    'V-스쿼트',
  ],
};

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 사용자 생성
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: '홍길동',
      gender: 'MALE',
      age: 30,
      height: 175.5,
      weight: 75.0,
    },
  });

  console.log('Created user:', user);

  // 운동 데이터 생성
  console.log('Seeding exercises...');
  for (const [category, names] of Object.entries(EXERCISES)) {
    for (const name of names) {
      await prisma.exercise.create({
        data: {
          name,
          category,
        },
      });
    }
  }
  console.log('Exercises seeded.');

  // PR 생성 (기존 유지)
  await prisma.pR.create({
    data: {
      userId: user.id,
      squat: 120.0,
      bench: 100.0,
      deadlift: 150.0,
    },
  });

  // 인바디 데이터 (기존 유지)
  await prisma.inbody.createMany({
    data: [
      {
        userId: user.id,
        date: new Date('2024-01-01'),
        weight: 75.0,
        skeletalMuscle: 35.0,
        bodyFat: 15.0,
        bodyFatPercent: 20.0,
        bmi: 24.4,
        basalMetabolic: 1800,
      },
      {
        userId: user.id,
        date: new Date('2024-01-15'),
        weight: 74.5,
        skeletalMuscle: 35.5,
        bodyFat: 14.5,
        bodyFatPercent: 19.5,
        bmi: 24.2,
        basalMetabolic: 1820,
      },
      {
        userId: user.id,
        date: new Date('2024-02-01'),
        weight: 74.0,
        skeletalMuscle: 36.0,
        bodyFat: 14.0,
        bodyFatPercent: 18.9,
        bmi: 24.1,
        basalMetabolic: 1830,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
