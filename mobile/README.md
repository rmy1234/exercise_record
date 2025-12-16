# 운동 기록 앱 (React Native + Expo)

## 환경 구축 완료 ✅

필요한 패키지가 모두 설치되었습니다:
- React Navigation (네비게이션)
- Axios (API 통신)
- AsyncStorage (로컬 저장소)
- React Native Chart Kit (통계 그래프)
- React Native SVG (차트용)

## 실행 방법

### 1. 개발 서버 시작

```bash
cd mobile
npm start
# 또는
npx expo start
```

### 2. 테스트 방법

#### 옵션 A: Expo Go 앱 사용 (가장 간단) ⭐ 권장
1. Android 기기에 **Expo Go** 앱 설치 (Google Play Store)
2. `npm start` 실행 후 나타나는 QR 코드 스캔
3. 실시간으로 앱 테스트 가능

#### 옵션 B: Android 에뮬레이터
1. Android Studio에서 에뮬레이터 실행
2. `npm start` 후 터미널에서 `a` 키 입력
3. 에뮬레이터에서 앱 실행

#### 옵션 C: 실제 기기 USB 연결
1. Android 기기에서 USB 디버깅 활성화
2. USB로 컴퓨터에 연결
3. `npm start` 후 터미널에서 `a` 키 입력

## 실제 기기에서 테스트할 때 주의사항

실제 Android 기기에서 테스트할 경우, API 연결을 위해 다음 설정이 필요합니다:

1. **컴퓨터와 기기가 같은 Wi-Fi에 연결**되어 있어야 합니다
2. **컴퓨터의 IP 주소 확인**:
   - Windows: `ipconfig` 실행 후 IPv4 주소 확인
   - 예: `192.168.0.100`
3. **API URL 변경**:
   - `mobile/config/api.ts` 파일 열기
   - `BASE_URL`을 `http://YOUR_IP:3000` 형식으로 변경
   - 예: `http://192.168.0.100:3000`
4. **백엔드 서버 실행 확인**:
   - 백엔드가 `http://localhost:3000`에서 실행 중이어야 합니다

## 프로젝트 구조

```
mobile/
├── app/                    # 화면 컴포넌트 (향후 구현)
├── components/             # 재사용 컴포넌트 (향후 구현)
├── services/               # API 통신
│   └── api.ts             # 백엔드 API 연결
├── config/                 # 설정 파일
│   └── api.ts             # API URL 설정
├── types/                  # TypeScript 타입 정의
│   └── index.ts
├── hooks/                  # 커스텀 훅 (향후 구현)
└── App.tsx                 # 메인 앱 컴포넌트
```

## 다음 단계

1. ✅ 환경 구축 완료
2. ✅ API 서비스 구현 완료
3. ⏳ 네비게이션 설정
4. ⏳ 주요 화면 구현
   - 홈 화면
   - 사용자 프로필
   - 루틴 관리
   - PR 기록
   - 인바디 통계





