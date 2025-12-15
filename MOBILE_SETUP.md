# 모바일 앱 개발 환경 구축 가이드

## React Native + Expo를 사용한 안드로이드 앱 개발

### 1. 필수 사항 설치

#### Node.js
- Node.js 18 이상 설치 필요
- 확인: `node --version`

#### Expo CLI 설치
```bash
npm install -g expo-cli
# 또는
npm install -g @expo/cli
```

#### Android 개발 환경 (선택사항 - 로컬에서 테스트할 경우)
- Android Studio 설치
- Android SDK 설치
- 에뮬레이터 설정

**또는** Expo Go 앱 사용 (더 간단)
- Android 기기에서 Expo Go 앱 설치
- QR 코드로 바로 테스트 가능

### 2. 프로젝트 구조

```
exercise_record/
├── backend/          # 기존 Nest.js 백엔드
├── mobile/           # React Native + Expo 앱
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── ...
└── ...
```

### 3. Expo 프로젝트 생성

```bash
cd exercise_record
npx create-expo-app mobile --template
```

템플릿 선택:
- **blank** (TypeScript) - 권장
- 또는 **tabs** (탭 네비게이션 포함)

### 4. 필요한 패키지 설치

```bash
cd mobile
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install axios
npm install @react-native-async-storage/async-storage
npm install react-native-chart-kit react-native-svg  # 통계 그래프용
```

### 5. 개발 모드 실행

```bash
npm start
# 또는
npx expo start
```

### 6. 테스트 방법

#### 옵션 A: Expo Go 앱 사용 (가장 간단)
1. Android 기기에 Expo Go 앱 설치
2. `npm start` 실행 후 QR 코드 스캔
3. 실시간으로 앱 테스트

#### 옵션 B: Android 에뮬레이터
1. Android Studio에서 에뮬레이터 실행
2. `npm start` 후 `a` 키 입력
3. 에뮬레이터에서 앱 실행

#### 옵션 C: 실제 기기 USB 연결
1. USB 디버깅 활성화
2. `npm start` 후 `a` 키 입력

## 프로젝트 구조 예시

```
mobile/
├── app/                    # Expo Router (파일 기반 라우팅)
│   ├── (tabs)/
│   │   ├── index.tsx       # 홈 화면
│   │   ├── exercises.tsx   # 운동 리스트
│   │   ├── record.tsx       # 기록 화면
│   │   └── stats.tsx        # 통계 화면
│   └── _layout.tsx
├── components/             # 재사용 컴포넌트
│   ├── ExerciseCard.tsx
│   ├── RecordForm.tsx
│   └── Chart.tsx
├── services/               # API 통신
│   └── api.ts
├── hooks/                  # 커스텀 훅
│   └── useExercises.ts
├── types/                  # TypeScript 타입
│   └── index.ts
└── app.json               # Expo 설정
```

## 다음 단계

1. Expo 프로젝트 생성
2. 네비게이션 설정
3. API 서비스 구현 (백엔드 연결)
4. 주요 화면 구현
   - 홈 화면
   - 운동 리스트
   - 기록 입력
   - 통계 화면

