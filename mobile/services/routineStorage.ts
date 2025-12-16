import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoutineTemplate, CreateRoutineTemplateRequest } from '../types';

const ROUTINES_KEY = 'workout_routines';

export const routineStorage = {
  // 모든 루틴 가져오기
  async getAll(userId: string): Promise<RoutineTemplate[]> {
    try {
      const key = `${ROUTINES_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to fetch routines:', error);
      return [];
    }
  },

  // 루틴 생성
  async create(userId: string, routine: CreateRoutineTemplateRequest): Promise<RoutineTemplate> {
    try {
      const routines = await this.getAll(userId);
      const newRoutine: RoutineTemplate = {
        id: Date.now().toString(),
        name: routine.name,
        exercises: routine.exercises,
        createdAt: new Date().toISOString(),
      };
      routines.push(newRoutine);
      
      const key = `${ROUTINES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(routines));
      return newRoutine;
    } catch (error) {
      console.error('Failed to create routine:', error);
      throw error;
    }
  },

  // 루틴 수정
  async update(userId: string, routineId: string, updates: Partial<CreateRoutineTemplateRequest>): Promise<RoutineTemplate | null> {
    try {
      const routines = await this.getAll(userId);
      const index = routines.findIndex(r => r.id === routineId);
      
      if (index === -1) return null;
      
      routines[index] = {
        ...routines[index],
        ...updates,
      };
      
      const key = `${ROUTINES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(routines));
      return routines[index];
    } catch (error) {
      console.error('Failed to update routine:', error);
      throw error;
    }
  },

  // 루틴 삭제
  async delete(userId: string, routineId: string): Promise<void> {
    try {
      const routines = await this.getAll(userId);
      const filtered = routines.filter(r => r.id !== routineId);
      
      const key = `${ROUTINES_KEY}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete routine:', error);
      throw error;
    }
  },

  // 특정 루틴 가져오기
  async getById(userId: string, routineId: string): Promise<RoutineTemplate | null> {
    try {
      const routines = await this.getAll(userId);
      return routines.find(r => r.id === routineId) || null;
    } catch (error) {
      console.error('Failed to fetch routine:', error);
      return null;
    }
  },
};



