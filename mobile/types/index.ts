// ... (기존 타입들)

// API 요청 타입
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePRRequest {
  userId: string;
  squat?: number;
  bench?: number;
  deadlift?: number;
  date?: string;
}

export interface CreateInbodyRequest {
  userId: string;
  date?: string;
  weight: number;
  skeletalMuscle: number;
  bodyFat?: number;
  bodyFatPercent?: number;
  bmi?: number;
  basalMetabolic?: number;
}

export interface CreateExerciseRequest {
  name: string;
  category: string;
}

export interface CreateRecordRequest {
  userId: string;
  exerciseId: string;
  date: string;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  name: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// PR (3대중량) 타입
export interface PR {
  id: string;
  userId: string;
  squat?: number;
  bench?: number;
  deadlift?: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// 인바디 타입
export interface Inbody {
  id: string;
  userId: string;
  date: string;
  weight: number;
  skeletalMuscle: number;
  bodyFat?: number;
  bodyFatPercent?: number;
  bmi?: number;
  basalMetabolic?: number;
  createdAt: string;
  updatedAt: string;
}

// 인바디 통계 타입
export interface InbodyStats {
  period: 'week' | 'month' | 'year';
  data: {
    date: string;
    weight: number;
    skeletalMuscle: number;
    bodyFat?: number;
    bodyFatPercent?: number;
    bmi?: number;
    basalMetabolic?: number;
  }[];
}

// 운동 타입
export interface Exercise {
  id: string;
  name: string;
  category: string;
}

// 기록 타입
export interface Record {
  id: string;
  userId: string;
  exerciseId: string;
  date: string;
  isCompleted: boolean; // 운동 완료 여부
  completedAt?: string; // 완료 시간
  sets: RecordSet[];
  createdAt: string;
  updatedAt: string;
  exercise?: Exercise; // 백엔드에서 include: { exercise: true }
}

export interface RecordSet {
  id: string;
  recordId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  restTime?: number; // 휴식시간 (초)
  createdAt: string;
}

// 루틴 템플릿 타입
export interface RoutineTemplate {
  id: string;
  name: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    category: string;
    sets?: {
      weight: number;
      reps: number;
      restTime?: number;
    }[];
  }[];
  createdAt: string;
}

export interface CreateRoutineTemplateRequest {
  name: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    category: string;
    sets?: {
      weight: number;
      reps: number;
      restTime?: number;
    }[];
  }[];
}
