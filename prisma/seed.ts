import { PrismaClient } from '@prisma/client';

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
  // 운동 데이터 생성
  console.log('Seeding exercises...');
  for (const [category, names] of Object.entries(EXERCISES)) {
    for (const name of names) {
      await prisma.exercise.upsert({
        where: { 
          // name과 category 조합으로 중복 확인
          id: `${category}_${name}`.replace(/\s/g, '_').toLowerCase(),
        },
        update: {},
        create: {
          id: `${category}_${name}`.replace(/\s/g, '_').toLowerCase(),
          name,
          category,
        },
      });
    }
  }
  console.log('Exercises seeded.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
