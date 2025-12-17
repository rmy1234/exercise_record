import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

const REMEMBER_ME_KEY = 'rememberMe';
const SAVED_EMAIL_KEY = 'savedEmail';
const SAVED_PASSWORD_KEY = 'savedPassword';

// 보안 저장소 유틸리티 (웹에서는 SecureStore 사용 불가)
const secureStorage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      // 웹에서는 sessionStorage 사용 (브라우저 닫으면 삭제됨)
      sessionStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return sessionStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(true);
  const { login } = useAuth();

  useEffect(() => {
    checkSavedCredentials();
  }, []);

  const checkSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe === 'true') {
        // 보안 저장소에서 이메일과 비밀번호 가져오기
        const savedEmail = await secureStorage.getItem(SAVED_EMAIL_KEY);
        const savedPassword = await secureStorage.getItem(SAVED_PASSWORD_KEY);
        
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
          
          // 자동 로그인 시도
          try {
            await login({ email: savedEmail, password: savedPassword });
          } catch (e) {
            // 자동 로그인 실패 시 저장된 정보 삭제
            await clearSavedCredentials();
            setRememberMe(false);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved credentials', e);
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  const saveCredentials = async (emailToSave: string, passwordToSave: string) => {
    try {
      // 이메일과 비밀번호는 보안 저장소에 저장 (암호화됨)
      await secureStorage.setItem(SAVED_EMAIL_KEY, emailToSave);
      await secureStorage.setItem(SAVED_PASSWORD_KEY, passwordToSave);
      // rememberMe 플래그는 일반 저장소에 저장
      await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
    } catch (e) {
      console.error('Failed to save credentials', e);
    }
  };

  const clearSavedCredentials = async () => {
    try {
      await secureStorage.removeItem(SAVED_EMAIL_KEY);
      await secureStorage.removeItem(SAVED_PASSWORD_KEY);
      await AsyncStorage.removeItem(REMEMBER_ME_KEY);
    } catch (e) {
      console.error('Failed to clear credentials', e);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      
      // 로그인 성공 시 로그인 유지 설정에 따라 처리
      if (rememberMe) {
        await saveCredentials(email, password);
      } else {
        await clearSavedCredentials();
      }
    } catch (e) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 자동 로그인 중 로딩 화면
  if (isAutoLoggingIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.appName}>RepNote</Text>
          <Text style={styles.loadingText}>로그인 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerContainer}>
            <Text style={styles.appName}>RepNote</Text>
            <Text style={styles.subtitle}>운동 기록을 시작해보세요.</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textSecondary + '60'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={Colors.textSecondary + '60'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
              <Text style={styles.rememberMeText}>로그인 유지하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.loginButtonText}>
                {isSubmitting ? '로그인 중...' : '로그인'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>계정이 없으신가요? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signupLink}>회원가입</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  appName: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: Colors.primary + '20',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberMeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
});






