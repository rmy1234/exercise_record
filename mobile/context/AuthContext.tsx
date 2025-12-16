import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginRequest, CreateUserRequest } from '../types';
import { usersApi } from '../services/api';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const user = await usersApi.login(data);
      setUser(user);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      router.replace('/(tabs)');
    } catch (e) {
      throw e;
    }
  };

  const signup = async (data: CreateUserRequest) => {
    try {
      const user = await usersApi.signup(data);
      // 회원가입 후 자동 로그인 처리할지, 로그인 페이지로 보낼지 결정
      // 여기서는 바로 로그인 처리
      setUser(user);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      router.replace('/(tabs)');
    } catch (e) {
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/auth/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await usersApi.update(user.id, data);
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}





