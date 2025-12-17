# 앱 빌드 가이드

이 문서는 운동 기록 앱을 Android APK와 iOS용으로 빌드하는 방법을 설명합니다.

## 사전 준비

### 1. Expo 계정 생성
1. https://expo.dev 에서 계정 생성
2. 로그인 후 프로젝트에 연결

### 2. EAS CLI 설치
```bash
npm install -g eas-cli
```

### 3. EAS 로그인
```bash
eas login
```

## Android APK 빌드 (Debug 모드)

### 방법 1: EAS Build 사용 (권장) ⭐

```bash
cd mobile
eas build --platform android --profile preview
```

또는 npm 스크립트 사용:
```bash
npm run build:android
```

**빌드 과정:**
1. EAS 서버에서 빌드가 시작됩니다
2. 빌드가 완료되면 다운로드 링크가 제공됩니다
3. APK 파일을 다운로드하여 설치할 수 있습니다

### 방법 2: 로컬 빌드 (고급)

로컬에서 빌드하려면 Android Studio와 개발 환경이 필요합니다:

```bash
npx expo prebuild
cd android
./gradlew assembleDebug
```

빌드된 APK는 `android/app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다.

## iOS 빌드 (iPhone용)

### EAS Build 사용

```bash
cd mobile
eas build --platform ios --profile preview
```

또는 npm 스크립트 사용:
```bash
npm run build:ios
```

**주의사항:**
- iOS 빌드는 **Apple Developer 계정**이 필요합니다 (연간 $99)
- 빌드된 앱을 실제 iPhone에 설치하려면:
  1. Apple Developer Program 가입
  2. `eas.json`에서 프로덕션 프로필 설정
  3. 빌드 후 TestFlight 또는 직접 설치

### iOS 시뮬레이터용 빌드 (무료)

시뮬레이터에서만 테스트하려면:
```bash
eas build --platform ios --profile development
```

## 동시 빌드 (Android + iOS)

```bash
npm run build:all
```

또는:
```bash
eas build --platform all --profile preview
```

## 빌드 프로필 설명

`eas.json` 파일에 정의된 빌드 프로필:

- **development**: 개발용 (Expo Go와 유사)
- **preview**: 내부 배포용 (APK/IPA 파일 생성)
- **production**: 프로덕션 배포용 (스토어 배포)

## 빌드 상태 확인

빌드 진행 상황 확인:
```bash
eas build:list
```

특정 빌드 상세 정보:
```bash
eas build:view [BUILD_ID]
```

## APK 설치 방법

1. 빌드 완료 후 다운로드 링크에서 APK 파일 다운로드
2. Android 기기에서:
   - 설정 → 보안 → 알 수 없는 소스 허용
   - APK 파일을 기기로 전송 (USB, 이메일, 클라우드 등)
   - 파일 관리자에서 APK 파일 열기
   - 설치 진행

## 문제 해결

### 빌드 실패 시
```bash
# 빌드 로그 확인
eas build:view [BUILD_ID]

# 캐시 클리어 후 재빌드
eas build --platform android --profile preview --clear-cache
```

### 로컬 빌드 오류
- Android Studio와 SDK가 올바르게 설치되었는지 확인
- `npx expo prebuild` 실행 후 `android` 폴더 확인

## API 서버 설정

빌드된 앱에서 API 서버에 접속하려면:

1. **개발 환경**: `mobile/config/api.ts`에서 개발 서버 IP 설정
2. **프로덕션**: 프로덕션 API 서버 URL로 변경 필요

현재 설정:
- 웹: `http://localhost:3000`
- 모바일: `http://10.2.2.154:3000`

프로덕션 배포 시에는 실제 서버 도메인으로 변경해야 합니다.

## 추가 리소스

- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [Android 빌드 가이드](https://docs.expo.dev/build/building-on-ci/)
- [iOS 빌드 가이드](https://docs.expo.dev/build/ios-builds/)





