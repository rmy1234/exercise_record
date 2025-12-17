// API 설정 파일
import { Platform } from 'react-native';

// 환경 변수에서 API URL 가져오기 (설정되지 않으면 기본값 사용)
const getBaseUrl = () => {
  // 환경 변수로 API URL 설정 가능 (다른 PC에서 테스트 시 유용)
  // 예: EXPO_PUBLIC_API_URL=http://192.168.0.100:3000
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // 웹 브라우저에서는 IP 주소 사용 (localhost는 연결 거부될 수 있음)
    if (Platform.OS === 'web') {
      return 'http://10.2.2.116:3000';
    }
    // 모바일/에뮬레이터에서는 컴퓨터의 IP 주소 사용
    // 실제 기기에서 테스트할 경우 이 값을 컴퓨터의 IP 주소로 변경하세요
    // 또는 .env 파일에 EXPO_PUBLIC_API_URL=http://YOUR_IP:3000 설정
    return 'http://10.2.2.116:3000';
  }
  // 프로덕션
  return 'https://your-api-domain.com';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
};

// 디버깅용: 현재 사용 중인 API URL 출력
if (__DEV__) {
  console.log('API Base URL:', API_CONFIG.BASE_URL);
}
