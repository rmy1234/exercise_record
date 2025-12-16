import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 웹 환경에서 페이지 제목 설정
    // favicon은 app.json의 web.favicon 설정에서 자동으로 처리됩니다
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'RepNote';
    }
  }, []);

  useEffect(() => {
    // 웹 환경에서 발생하는 라이브러리 호환성 경고 무시
    if (Platform.OS === 'web') {
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args) => {
        const message = String(args[0] || '');
        if (
          message.includes('Invalid DOM property') || 
          message.includes('transform-origin') ||
          message.includes('transformOrigin') ||
          message.includes('Unknown event handler property') ||
          message.includes('onResponder') ||
          message.includes('onStartShouldSetResponder') ||
          message.includes('Did you mean') ||
          message.includes('Accessing element.ref') ||
          message.includes('ref is now a regular prop')
        ) {
          return;
        }
        originalError(...args);
      };

      console.warn = (...args) => {
        const message = String(args[0] || '');
        if (
          message.includes('Invalid DOM property') || 
          message.includes('transform-origin') ||
          message.includes('transformOrigin') ||
          message.includes('Unknown event handler property') ||
          message.includes('onResponder') ||
          message.includes('onStartShouldSetResponder') ||
          message.includes('Did you mean') ||
          message.includes('Accessing element.ref') ||
          message.includes('ref is now a regular prop')
        ) {
          return;
        }
        originalWarn(...args);
      };

      // React DevTools 경고도 필터링
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // DOM 렌더링 후 React의 경고를 필터링하기 위해 MutationObserver 사용
        const observer = new MutationObserver(() => {
          // 경고 메시지를 DOM에서 제거 (ErrorOverlay)
          const errorOverlay = document.querySelector('[data-react-error-overlay]') || 
                               document.querySelector('.react-error-overlay');
          if (errorOverlay) {
            const errorText = errorOverlay.textContent || '';
            if (errorText.includes('transform-origin') || 
                errorText.includes('Invalid DOM property') ||
                errorText.includes('Accessing element.ref') ||
                errorText.includes('ref is now a regular prop')) {
              errorOverlay.remove();
            }
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }

    // 앱 내 경고 메시지 무시 (모바일용)
    LogBox.ignoreLogs([
      'Invalid DOM property',
      'Unknown event handler property',
      /transform-origin/i,
      /transformOrigin/i,
      /onResponder/,
      /onStartShouldSetResponder/,
      /Did you mean/,
      /Accessing element\.ref/,
      /ref is now a regular prop/,
    ]);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inSplash = segments.join('/') === '';

    if (!user) {
      if (!inAuthGroup && !inSplash) {
        // 로그인 안 되어 있으면 로그인 페이지로
        router.replace('/auth/login');
      }
      return;
    }

    if (user && (inAuthGroup || inSplash)) {
      // 로그인 되어 있는데 로그인/스플래시에 있으면 홈으로
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  return (
    <>
      <Slot />
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
