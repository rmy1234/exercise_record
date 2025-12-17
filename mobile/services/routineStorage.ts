import { routinesApi } from './api';
import { RoutineTemplate, CreateRoutineTemplateRequest } from '../types';

export const routineStorage = {
  // 모든 루틴 가져오기
  async getAll(userId: string): Promise<RoutineTemplate[]> {
    try {
      const data = await routinesApi.getAll(userId);
      // exercises가 JSON 문자열인 경우 파싱
      return data.map((routine: any) => ({
        ...routine,
        exercises: typeof routine.exercises === 'string' 
          ? JSON.parse(routine.exercises) 
          : routine.exercises,
      }));
    } catch (error) {
      console.error('Failed to fetch routines:', error);
      return [];
    }
  },

  // 루틴 생성
  async create(userId: string, routine: CreateRoutineTemplateRequest): Promise<RoutineTemplate> {
    try {
      const data = await routinesApi.create(userId, routine);
      return {
        ...data,
        exercises: typeof data.exercises === 'string' 
          ? JSON.parse(data.exercises) 
          : data.exercises,
      };
    } catch (error) {
      console.error('Failed to create routine:', error);
      throw error;
    }
  },

  // 루틴 수정
  async update(userId: string, routineId: string, updates: Partial<CreateRoutineTemplateRequest>): Promise<RoutineTemplate | null> {
    try {
      const data = await routinesApi.update(routineId, userId, updates);
      return {
        ...data,
        exercises: typeof data.exercises === 'string' 
          ? JSON.parse(data.exercises) 
          : data.exercises,
      };
    } catch (error) {
      console.error('Failed to update routine:', error);
      throw error;
    }
  },

  // 루틴 삭제
  async delete(userId: string, routineId: string): Promise<void> {
    try {
      await routinesApi.delete(routineId, userId);
    } catch (error) {
      console.error('Failed to delete routine:', error);
      throw error;
    }
  },

  // 특정 루틴 가져오기
  async getById(userId: string, routineId: string): Promise<RoutineTemplate | null> {
    try {
      const data = await routinesApi.getById(routineId, userId);
      return {
        ...data,
        exercises: typeof data.exercises === 'string' 
          ? JSON.parse(data.exercises) 
          : data.exercises,
      };
    } catch (error) {
      console.error('Failed to fetch routine:', error);
      return null;
    }
  },
};




