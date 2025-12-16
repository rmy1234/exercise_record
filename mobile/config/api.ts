// API 설정 파일
import { Platform } from 'react-native';

// 플랫폼별 API URL 설정
const getBaseUrl = () => {
  if (__DEV__) {
    // 웹 브라우저에서는 localhost 사용
    if (Platform.OS === 'web') {
      return 'http://localhost:3000';
    }
    // 모바일/에뮬레이터에서는 컴퓨터의 IP 주소 사용
    // 실제 기기에서 테스트할 경우 이 값을 컴퓨터의 IP 주소로 변경하세요
    return 'http://10.2.2.154:3000';
  }
  // 프로덕션
  return 'https://your-api-domain.com';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
};
