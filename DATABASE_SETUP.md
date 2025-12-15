# 데이터베이스 설정 가이드

## 현재 상황

pgAdmin4에서 "exercise" 서버를 생성하고 "exercise_record" 데이터베이스를 만들었습니다.
같은 PostgreSQL 인스턴스에 "grade_db"도 보이는 것은 정상입니다.

**중요**: PostgreSQL에서 서버 = 인스턴스, 데이터베이스 = 논리적 분리 단위입니다.
같은 인스턴스의 모든 데이터베이스가 보이지만, 각 데이터베이스는 독립적입니다.

## 설정 방법

`.env` 파일을 생성하고 `exercise_record` 데이터베이스에 연결하도록 설정하세요:

```
DATABASE_URL="postgresql://사용자명:비밀번호@호스트:5432/exercise_record?schema=public"
```

### pgAdmin4에서 연결 정보 확인 방법:
1. "exercise" 서버를 우클릭 → Properties
2. Connection 탭에서 호스트, 포트, 사용자명 확인
3. 위 정보를 사용하여 DATABASE_URL 구성

### 예시:
- 로컬 PostgreSQL인 경우:
```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/exercise_record?schema=public"
```

- 원격 서버인 경우:
```
DATABASE_URL="postgresql://username:password@서버주소:5432/exercise_record?schema=public"
```

## 주의사항

- `DATABASE_URL`에 `exercise_record`를 명시하면 해당 DB에만 연결됩니다
- `grade_db`는 같은 인스턴스에 있지만, `exercise_record`에 연결하면 `grade_db`의 데이터는 접근하지 않습니다
- 각 데이터베이스는 완전히 독립적이므로 안전합니다

## 마이그레이션 실행

데이터베이스 설정 후:

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 마이그레이션 실행 (테이블 생성)
npx prisma migrate dev --name init

# 시드 데이터 생성 (선택)
npx prisma db seed
```

## 주의사항

- 기존 DB를 사용하는 경우, Prisma가 생성하는 테이블명이 기존 테이블과 충돌하지 않는지 확인하세요.
- 스키마에 정의된 테이블: `users`, `routines`, `prs`, `inbody`, `exercises`, `records`, `record_sets`
- 기존 테이블과 이름이 겹치면 테이블명을 변경하거나 별도 스키마를 사용하세요.

