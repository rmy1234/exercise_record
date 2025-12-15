# 운동 기록 앱 백엔드

Nest.js + Prisma + PostgreSQL 기반 운동 기록 백엔드 API

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:
```
DATABASE_URL="postgresql://user:password@localhost:5432/exercise_record?schema=public"
```

### 3. Prisma 마이그레이션
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. 시드 데이터 생성 (선택)
```bash
npm run prisma:seed
```

### 5. 서버 실행
```bash
npm run start:dev
```

서버는 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### Users (사용자)
- `POST /users` - 사용자 생성
- `GET /users` - 사용자 목록
- `GET /users/:id` - 사용자 상세 (루틴, PR, 인바디 포함)
- `PATCH /users/:id` - 사용자 정보 수정
- `DELETE /users/:id` - 사용자 삭제

### Routines (루틴)
- `POST /routines` - 루틴 생성
- `GET /routines?userId=xxx` - 루틴 목록 (사용자별 필터링 가능)
- `GET /routines/:id` - 루틴 상세
- `PATCH /routines/:id` - 루틴 수정
- `DELETE /routines/:id` - 루틴 삭제

### PRs (3대중량)
- `POST /prs` - PR 기록 생성
- `GET /prs?userId=xxx` - PR 목록
- `GET /prs/latest?userId=xxx` - 최신 PR 조회
- `GET /prs/:id` - PR 상세
- `PATCH /prs/:id` - PR 수정
- `DELETE /prs/:id` - PR 삭제

### Inbody (인바디)
- `POST /inbody` - 인바디 데이터 생성
- `GET /inbody?userId=xxx` - 인바디 목록
- `GET /inbody/stats?userId=xxx&period=week|month|year` - 인바디 통계 (그래프용)
- `GET /inbody/:id` - 인바디 상세
- `PATCH /inbody/:id` - 인바디 수정
- `DELETE /inbody/:id` - 인바디 삭제

## 데이터베이스 스키마

- **User**: 이름, 나이, 키, 몸무게
- **Routine**: 루틴 이름, 설명, 운동 목록 (JSON)
- **PR**: 스쿼트, 벤치프레스, 데드리프트 최고 기록
- **Inbody**: 체중, 골격근량, 체지방량, BMI, 기초대사량 등

## 기술 스택

- Nest.js
- Prisma
- PostgreSQL
- TypeScript


