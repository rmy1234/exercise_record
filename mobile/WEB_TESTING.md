# PC에서 웹 브라우저로 테스트하기

## 방법 1: 웹 브라우저에서 실행 (가장 간단) ⭐

Expo는 기본적으로 웹 지원을 포함하고 있습니다.

### 실행 방법

```bash
cd mobile
npm run web
# 또는
npx expo start --web
```

이 명령어를 실행하면:
1. 자동으로 기본 웹 브라우저가 열립니다
2. `http://localhost:8081` (또는 다른 포트)에서 앱이 실행됩니다
3. 실시간으로 코드 변경사항이 반영됩니다 (Hot Reload)

### 장점
- ✅ 별도 설치 불필요 (브라우저만 있으면 됨)
- ✅ 빠른 개발 및 테스트
- ✅ 디버깅 도구 사용 가능 (Chrome DevTools)

### 제한사항
- ⚠️ 일부 네이티브 기능은 웹에서 작동하지 않을 수 있습니다
- ⚠️ 모바일 전용 UI/UX는 웹에서 다르게 보일 수 있습니다

## 방법 2: Android 에뮬레이터 사용

실제 Android 환경과 가장 유사하게 테스트할 수 있습니다.

### 필요 사항
1. **Android Studio 설치**
   - https://developer.android.com/studio 에서 다운로드
   - 설치 시 Android SDK 포함

2. **에뮬레이터 생성**
   - Android Studio 실행
   - Tools → Device Manager
   - Create Device → 원하는 기기 선택
   - 시스템 이미지 다운로드 및 설치

### 실행 방법

```bash
cd mobile
npm start
```

터미널에서:
- `a` 키를 눌러 Android 에뮬레이터에서 실행
- 또는 `w` 키를 눌러 웹 브라우저에서 실행

### 장점
- ✅ 실제 Android 환경과 동일
- ✅ 모든 네이티브 기능 테스트 가능
- ✅ 실제 기기 없이도 테스트 가능

### 단점
- ⚠️ Android Studio 설치 필요 (용량 큼)
- ⚠️ 에뮬레이터가 컴퓨터 리소스를 많이 사용

## 추천 워크플로우

1. **개발 단계**: 웹 브라우저 사용 (`npm run web`)
   - 빠른 개발 및 테스트
   - UI/UX 확인

2. **네이티브 기능 테스트**: Android 에뮬레이터 사용
   - 카메라, 센서 등 네이티브 기능 테스트
   - 실제 기기와 유사한 환경

3. **최종 테스트**: 실제 Android 기기
   - 성능 테스트
   - 실제 사용자 환경 확인

## 웹에서 API 연결

웹 브라우저에서 테스트할 때는 `localhost:3000`으로 백엔드에 연결할 수 있습니다.

`mobile/config/api.ts` 파일에서:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000', // 웹에서는 localhost 사용 가능
  TIMEOUT: 10000,
};
```

## 문제 해결

### 포트 충돌
다른 포트를 사용하려면:
```bash
npx expo start --web --port 8082
```

### 웹이 열리지 않을 때
수동으로 브라우저에서 열기:
- 터미널에 표시된 URL을 복사하여 브라우저에 입력
- 예: `http://localhost:8081`








