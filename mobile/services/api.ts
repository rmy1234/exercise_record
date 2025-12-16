import axios from 'axios';
import { API_CONFIG } from '../config/api';
import {
  User,
  PR,
  Inbody,
  InbodyStats,
  Exercise,
  Record,
  CreateUserRequest,
  LoginRequest,
  CreatePRRequest,
  CreateInbodyRequest,
  CreateExerciseRequest,
  CreateRecordRequest,
} from '../types';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  signup: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<User> => {
    const response = await api.post<User>('/users/login', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// PRs API
export const prsApi = {
  getAll: async (userId?: string): Promise<PR[]> => {
    const params = userId ? { userId } : {};
    const response = await api.get<PR[]>('/prs', { params });
    return response.data;
  },

  getLatest: async (userId: string): Promise<PR | null> => {
    const response = await api.get<PR>('/prs/latest', { params: { userId } });
    return response.data;
  },

  getById: async (id: string): Promise<PR> => {
    const response = await api.get<PR>(`/prs/${id}`);
    return response.data;
  },

  create: async (data: CreatePRRequest): Promise<PR> => {
    const response = await api.post<PR>('/prs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<PR>): Promise<PR> => {
    const response = await api.patch<PR>(`/prs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/prs/${id}`);
  },
};

// Inbody API
export const inbodyApi = {
  getAll: async (userId?: string): Promise<Inbody[]> => {
    const params = userId ? { userId } : {};
    const response = await api.get<Inbody[]>('/inbody', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Inbody> => {
    const response = await api.get<Inbody>(`/inbody/${id}`);
    return response.data;
  },

  getStats: async (
    userId: string,
    period: 'week' | 'month' | 'year' = 'week',
  ): Promise<InbodyStats> => {
    const response = await api.get<InbodyStats>('/inbody/stats', {
      params: { userId, period },
    });
    return response.data;
  },

  create: async (data: CreateInbodyRequest): Promise<Inbody> => {
    const response = await api.post<Inbody>('/inbody', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Inbody>): Promise<Inbody> => {
    const response = await api.patch<Inbody>(`/inbody/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inbody/${id}`);
  },
};

// Exercises API
export const exercisesApi = {
  getAll: async (): Promise<Exercise[]> => {
    const response = await api.get<Exercise[]>('/exercises');
    return response.data;
  },

  create: async (data: CreateExerciseRequest): Promise<Exercise> => {
    const response = await api.post<Exercise>('/exercises', data);
    return response.data;
  },
};

// Records API
export const recordsApi = {
  getAll: async (exerciseId?: string): Promise<Record[]> => {
    const params = exerciseId ? { exerciseId } : {};
    const response = await api.get<Record[]>('/records', { params });
    return response.data;
  },

  getByDate: async (userId: string, date: string): Promise<Record[]> => {
    const response = await api.get<Record[]>('/records', {
      params: { userId, date },
    });
    return response.data;
  },

  getByExercise: async (userId: string, exerciseId: string): Promise<Record[]> => {
    const response = await api.get<Record[]>('/records', {
      params: { userId, exerciseId },
    });
    return response.data;
  },

  create: async (data: CreateRecordRequest): Promise<Record> => {
    const response = await api.post<Record>('/records', data);
    return response.data;
  },

  addSet: async (recordId: string, setData: { setNumber: number; weight: number; reps: number; rpe?: number; restTime?: number }) => {
    const response = await api.post(`/records/${recordId}/sets`, setData);
    return response.data;
  },

  updateSet: async (setId: string, setData: { weight?: number; reps?: number; rpe?: number; restTime?: number }) => {
    const response = await api.patch(`/records/sets/${setId}`, setData);
    return response.data;
  },

  deleteSet: async (setId: string) => {
    await api.delete(`/records/sets/${setId}`);
  },

  delete: async (recordId: string) => {
    await api.delete(`/records/${recordId}`);
  },
};

// WorkoutDays API (운동 완료 여부/주간 카운트용)
export const workoutDaysApi = {
  complete: async (userId: string, date: string): Promise<void> => {
    await api.post('/workout-days/complete', { userId, date });
  },

  status: async (userId: string, date: string): Promise<{ completed: boolean }> => {
    const response = await api.get('/workout-days/status', { params: { userId, date } });
    return response.data;
  },

  getCompletedDates: async (
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<string[]> => {
    const response = await api.get<string[]>('/workout-days/completed-dates', {
      params: { userId, startDate, endDate },
    });
    return response.data;
  },
};

export default api;
