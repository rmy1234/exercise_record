import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Record, RecordSet } from '../../types';
import { recordsApi, workoutDaysApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Check,
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Timer,
  Trophy,
} from 'lucide-react-native';

// Animated Circle 컴포넌트
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// 운동 상태 타입
interface WorkoutSet {
  id?: string;
  setNumber: number;
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  actualWeight?: number;
  actualReps?: number;
}

interface WorkoutExercise {
  recordId: string;
  exerciseName: string;
  category: string;
  sets: WorkoutSet[];
  completed: boolean;
}

type WorkoutPhase = 'exercise' | 'rest' | 'completed';

export default function WorkoutScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // 운동 데이터
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>('exercise');
  const [isLoading, setIsLoading] = useState(true);

  // 수정 모드
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  // 휴식 타이머
  const [restTime, setRestTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 원형 프로그레스 설정
  const CIRCLE_SIZE = 220;
  const STROKE_WIDTH = 8;
  const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // 운동 시작 시간
  const [startTime] = useState(new Date());

  // 오늘 루틴 불러오기
  const loadTodayRecords = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await recordsApi.getByDate(user.id, today);

      if (records.length === 0) {
        Alert.alert('알림', '오늘 등록된 루틴이 없습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
        return;
      }

      // Record를 WorkoutExercise로 변환
      const workoutExercises: WorkoutExercise[] = records.map((record) => ({
        recordId: record.id,
        exerciseName: record.exercise?.name || '알 수 없는 운동',
        category: record.exercise?.category || '',
        sets:
          record.sets && record.sets.length > 0
            ? record.sets.map((set, idx) => ({
                id: set.id,
                setNumber: idx + 1,
                weight: set.weight,
                reps: set.reps,
                restTime: set.restTime || 60,
                completed: false,
              }))
            : [
                {
                  setNumber: 1,
                  weight: 0,
                  reps: 10,
                  restTime: 60,
                  completed: false,
                },
              ],
        completed: false,
      }));

      setExercises(workoutExercises);

      // 첫 세트 초기화
      if (workoutExercises.length > 0 && workoutExercises[0].sets.length > 0) {
        const firstSet = workoutExercises[0].sets[0];
        setEditWeight(firstSet.weight.toString());
        setEditReps(firstSet.reps.toString());
      }
    } catch (e) {
      console.error('Failed to load records', e);
      Alert.alert('오류', '루틴을 불러오는데 실패했습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    loadTodayRecords();
  }, [loadTodayRecords]);

  // 현재 운동/세트
  const currentExercise = exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];

  // 현재 세트 변경 시 입력값 업데이트
  useEffect(() => {
    if (currentSet) {
      setEditWeight(currentSet.weight.toString());
      setEditReps(currentSet.reps.toString());
    }
  }, [currentExerciseIndex, currentSetIndex]);

  // 휴식 타이머 시작
  const startRestTimer = (seconds: number) => {
    setRestTime(seconds);
    setRemainingTime(seconds);
    setPhase('rest');
    setIsTimerPaused(false);

    // 원형 프로그레스 애니메이션 (0에서 1로)
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: seconds * 1000,
      useNativeDriver: false, // strokeDashoffset은 useNativeDriver 불가
    }).start();
  };

  // 타이머 카운트다운
  useEffect(() => {
    if (phase === 'rest' && remainingTime > 0 && !isTimerPaused) {
      timerRef.current = setTimeout(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'rest' && remainingTime === 0) {
      // 타이머 완료
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }
      progressAnim.stopAnimation();
      handleNextSet();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [phase, remainingTime, isTimerPaused]);

  // 타이머 일시정지 시 애니메이션도 정지
  useEffect(() => {
    if (isTimerPaused && phase === 'rest') {
      progressAnim.stopAnimation();
    } else if (!isTimerPaused && phase === 'rest' && remainingTime > 0) {
      // 재개 시 남은 시간에 맞춰 애니메이션 계속
      const currentProgress = 1 - remainingTime / restTime;
      progressAnim.setValue(currentProgress);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingTime * 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [isTimerPaused]);

  // strokeDashoffset 계산
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCUMFERENCE],
  });

  // 세트 완료 처리
  const handleCompleteSet = async () => {
    if (!currentExercise || !currentSet) return;

    const actualWeight = parseFloat(editWeight) || currentSet.weight;
    const actualReps = parseInt(editReps, 10) || currentSet.reps;

    // 세트 업데이트
    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex].sets[currentSetIndex] = {
      ...currentSet,
      completed: true,
      actualWeight,
      actualReps,
    };
    setExercises(updatedExercises);

    // 서버에 저장 (세트 ID가 있는 경우)
    if (currentSet.id) {
      try {
        await recordsApi.updateSet(currentSet.id, {
          weight: actualWeight,
          reps: actualReps,
        });
      } catch (e) {
        console.error('Failed to update set', e);
      }
    }

    // 마지막 세트인지 확인
    const isLastSet = currentSetIndex === currentExercise.sets.length - 1;
    const isLastExercise = currentExerciseIndex === exercises.length - 1;

    if (isLastSet && isLastExercise) {
      // 모든 운동 완료
      updatedExercises[currentExerciseIndex].completed = true;
      setExercises(updatedExercises);
      setPhase('completed');
      
      // 오늘 운동 완료 상태 저장
      const today = new Date().toISOString().split('T')[0];
      AsyncStorage.setItem(`workout_completed_${today}`, 'true').catch(console.error);
      // 서버에도 완료 상태 저장(주간 카운트용)
      if (user?.id) {
        workoutDaysApi.complete(user.id, today).catch(console.error);
      }
    } else if (isLastSet) {
      // 다음 운동으로 (운동과 운동 사이에는 휴식 없음)
      updatedExercises[currentExerciseIndex].completed = true;
      setExercises(updatedExercises);
      handleNextSet(); // 바로 다음 운동으로 이동
    } else {
      // 다음 세트로 (세트 사이에만 휴식 시작)
      startRestTimer(currentSet.restTime);
    }
  };

  // 다음 세트/운동으로 이동
  const handleNextSet = () => {
    setPhase('exercise');

    if (currentExercise) {
      const isLastSet = currentSetIndex === currentExercise.sets.length - 1;

      if (isLastSet) {
        // 다음 운동으로
        if (currentExerciseIndex < exercises.length - 1) {
          setCurrentExerciseIndex((prev) => prev + 1);
          setCurrentSetIndex(0);
        }
      } else {
        // 다음 세트로
        setCurrentSetIndex((prev) => prev + 1);
      }
    }
  };

  // 휴식 스킵
  const handleSkipRest = () => {
    progressAnim.stopAnimation();
    handleNextSet();
  };

  // 타이머 일시정지/재개
  const toggleTimer = () => {
    setIsTimerPaused((prev) => !prev);
  };

  // 운동 종료
  const handleFinish = () => {
    const confirmFinish = () => {
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm('운동을 종료하시겠습니까?')) {
        confirmFinish();
      }
    } else {
      Alert.alert('운동 종료', '운동을 종료하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '종료', onPress: confirmFinish },
      ]);
    }
  };

  // 완료된 세트 수 계산
  const completedSetsCount = exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSetsCount = exercises.reduce((total, ex) => total + ex.sets.length, 0);

  // 운동 시간 계산
  const getElapsedTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Dumbbell color={Colors.primary} size={48} />
          <Text style={styles.loadingText}>운동 준비 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 완료 화면
  if (phase === 'completed') {
    const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const totalVolume = exercises.reduce(
      (total, ex) =>
        total +
        ex.sets.reduce(
          (setTotal, set) =>
            setTotal + (set.actualWeight || set.weight) * (set.actualReps || set.reps),
          0
        ),
      0
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <View style={styles.trophyContainer}>
            <Trophy color={Colors.warning} size={80} />
          </View>
          <Text style={styles.completedTitle}>운동 완료!</Text>
          <Text style={styles.completedSubtitle}>오늘도 수고하셨습니다!</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>운동 시간</Text>
              <Text style={styles.summaryValue}>{formatTime(elapsedSeconds)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>완료 세트</Text>
              <Text style={styles.summaryValue}>
                {completedSetsCount}/{totalSetsCount}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>총 볼륨</Text>
              <Text style={styles.summaryValue}>{totalVolume.toLocaleString()} kg</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={() => router.back()}>
            <Text style={styles.finishButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleFinish} style={styles.closeButton}>
          <X color={Colors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {currentExerciseIndex + 1}/{exercises.length}
          </Text>
          <Text style={styles.headerSubtitle}>{getElapsedTime()}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressBadgeText}>
            {completedSetsCount}/{totalSetsCount}
          </Text>
        </View>
      </View>

      {/* 진행 바 */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${(completedSetsCount / totalSetsCount) * 100}%` },
          ]}
        />
      </View>

      {phase === 'rest' ? (
        /* 휴식 화면 */
        <View style={styles.restContainer}>
          <Text style={styles.restLabel}>휴식 시간</Text>

          {/* 원형 프로그레스 타이머 */}
          <View style={styles.circularTimerContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.circularSvg}>
              {/* 배경 원 */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={Colors.primary + '30'}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              {/* 프로그레스 원 */}
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={Colors.primary}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              />
            </Svg>
            {/* 타이머 텍스트 (원 중앙) */}
            <View style={styles.timerTextContainer}>
              <Text style={styles.timerText}>{formatTime(remainingTime)}</Text>
              <Text style={styles.timerSubtext}>남은 시간</Text>
            </View>
          </View>

          <View style={styles.timerControls}>
            <TouchableOpacity style={styles.timerButton} onPress={toggleTimer}>
              {isTimerPaused ? (
                <Play color={Colors.primary} size={24} />
              ) : (
                <Pause color={Colors.primary} size={24} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timerButton, styles.skipButton]}
              onPress={handleSkipRest}
            >
              <SkipForward color={Colors.primary} size={20} />
              <Text style={styles.skipButtonText}>스킵</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nextExercisePreview}>
            <Text style={styles.nextLabel}>다음</Text>
            <Text style={styles.nextExerciseName}>
              {currentExerciseIndex < exercises.length - 1 &&
              currentSetIndex === currentExercise.sets.length - 1
                ? exercises[currentExerciseIndex + 1].exerciseName
                : `${currentExercise?.exerciseName} - ${currentSetIndex + 2}세트`}
            </Text>
          </View>
        </View>
      ) : (
        /* 운동 화면 */
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* 현재 운동 */}
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseBadge}>
                <Dumbbell color={Colors.primary} size={20} />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{currentExercise?.exerciseName}</Text>
                <Text style={styles.exerciseCategory}>{currentExercise?.category}</Text>
              </View>
            </View>

            {/* 세트 표시 */}
            <View style={styles.setsIndicator}>
              {currentExercise?.sets.map((set, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.setDot,
                    set.completed && styles.setDotCompleted,
                    idx === currentSetIndex && styles.setDotCurrent,
                  ]}
                >
                  {set.completed ? (
                    <Check color="#fff" size={12} />
                  ) : (
                    <Text style={styles.setDotText}>{idx + 1}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* 현재 세트 정보 */}
            <View style={styles.currentSetCard}>
              <Text style={styles.currentSetLabel}>
                {currentSetIndex + 1}세트
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>무게 (kg)</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity
                      style={styles.inputButton}
                      onPress={() =>
                        setEditWeight((prev) =>
                          Math.max(0, parseFloat(prev) - 2.5).toString()
                        )
                      }
                    >
                      <ChevronLeft color={Colors.primary} size={20} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.input}
                      value={editWeight}
                      onChangeText={setEditWeight}
                      keyboardType="numeric"
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={styles.inputButton}
                      onPress={() =>
                        setEditWeight((prev) => (parseFloat(prev) + 2.5).toString())
                      }
                    >
                      <ChevronRight color={Colors.primary} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>횟수</Text>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity
                      style={styles.inputButton}
                      onPress={() =>
                        setEditReps((prev) =>
                          Math.max(1, parseInt(prev, 10) - 1).toString()
                        )
                      }
                    >
                      <ChevronLeft color={Colors.primary} size={20} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.input}
                      value={editReps}
                      onChangeText={setEditReps}
                      keyboardType="numeric"
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={styles.inputButton}
                      onPress={() =>
                        setEditReps((prev) => (parseInt(prev, 10) + 1).toString())
                      }
                    >
                      <ChevronRight color={Colors.primary} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {currentSet && currentSet.weight > 0 && (
                <View style={styles.targetInfo}>
                  <Timer color={Colors.textSecondary} size={14} />
                  <Text style={styles.targetText}>
                    목표: {currentSet.weight}kg × {currentSet.reps}회 | 휴식:{' '}
                    {currentSet.restTime}초
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 완료 버튼 */}
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteSet}>
            <Check color="#fff" size={24} />
            <Text style={styles.completeButtonText}>세트 완료</Text>
          </TouchableOpacity>

          {/* 운동 목록 미리보기 */}
          <View style={styles.exerciseListPreview}>
            <Text style={styles.listPreviewTitle}>오늘의 루틴</Text>
            {exercises.map((ex, idx) => (
              <View
                key={ex.recordId}
                style={[
                  styles.previewItem,
                  idx === currentExerciseIndex && styles.previewItemCurrent,
                  ex.completed && styles.previewItemCompleted,
                ]}
              >
                <View style={styles.previewNumber}>
                  {ex.completed ? (
                    <Check color={Colors.success} size={14} />
                  ) : (
                    <Text
                      style={[
                        styles.previewNumberText,
                        idx === currentExerciseIndex && styles.previewNumberTextCurrent,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.previewName,
                    ex.completed && styles.previewNameCompleted,
                  ]}
                >
                  {ex.exerciseName}
                </Text>
                <Text style={styles.previewSets}>
                  {ex.sets.filter((s) => s.completed).length}/{ex.sets.length}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  // 진행 바
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  // 콘텐츠
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  // 운동 카드
  exerciseCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  exerciseBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  exerciseCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // 세트 인디케이터
  setsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  setDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setDotCompleted: {
    backgroundColor: Colors.success,
  },
  setDotCurrent: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.2 }],
  },
  setDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // 현재 세트 카드
  currentSetCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 16,
    padding: 16,
  },
  currentSetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputButton: {
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    paddingVertical: 12,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  targetText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // 완료 버튼
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // 운동 목록 미리보기
  exerciseListPreview: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
  },
  listPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  previewItemCurrent: {
    backgroundColor: Colors.primary + '10',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  previewItemCompleted: {
    opacity: 0.6,
  },
  previewNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  previewNumberTextCurrent: {
    color: Colors.primary,
  },
  previewName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  previewNameCompleted: {
    textDecorationLine: 'line-through',
  },
  previewSets: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // 휴식 화면
  restContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  restLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 32,
  },
  circularTimerContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularSvg: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
  },
  timerSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
  },
  timerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  skipButton: {
    width: 'auto',
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 8,
  },
  skipButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextExercisePreview: {
    marginTop: 48,
    alignItems: 'center',
  },
  nextLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  nextExerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  // 완료 화면
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  trophyContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 48,
    marginTop: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
