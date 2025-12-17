import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Dumbbell, TrendingUp, Calendar, ArrowUp, Check, X, ChevronRight, ListOrdered } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { recordsApi, workoutDaysApi, prsApi } from '../../services/api';
import { Record, RoutineTemplate, PR } from '../../types';
import { routineStorage } from '../../services/routineStorage';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [todayRecords, setTodayRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyWorkoutDays, setWeeklyWorkoutDays] = useState(0);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [latestPR, setLatestPR] = useState<PR | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // 오늘 운동 완료 여부 확인
  const checkWorkoutCompleted = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    if (user?.id) {
      try {
        const status = await workoutDaysApi.status(user.id, today);
        setIsWorkoutCompleted(status.completed === true);
        return;
      } catch {
        // fallback below
      }
    }
    const completed = await AsyncStorage.getItem(`workout_completed_${today}`);
    setIsWorkoutCompleted(completed === 'true');
  }, []);

  const todayKey = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }, []);

  const fetchToday = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await recordsApi.getByDate(user.id, todayKey);
      setTodayRecords(data);
    } catch (e) {
      setTodayRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, todayKey]);

  // 이번 주 운동 일수 계산 (일요일~토요일 기준)
  const fetchWeeklyWorkoutDays = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0(일요일) ~ 6(토요일)
      
      // 이번 주 일요일 계산
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dayOfWeek);
      sunday.setHours(0, 0, 0, 0);
      
      // 이번 주 토요일 계산
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      saturday.setHours(23, 59, 59, 999);
      
      // 일주일간의 모든 날짜 생성
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);
        dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD 형식
      }
      
      // '운동 완료'된 날짜만 집계 (서버 기준)
      try {
        const completedDates = await workoutDaysApi.getCompletedDates(
          user.id,
          dates[0],
          dates[dates.length - 1],
        );
        setWeeklyWorkoutDays(completedDates.length);
      } catch (e) {
        // 백엔드 미가동 등 예외 시 로컬 완료 플래그로 폴백(동일 기기 한정)
        const completed = await Promise.all(
          dates.map(async (date) => {
            const v = await AsyncStorage.getItem(`workout_completed_${date}`);
            return v === 'true';
          }),
        );
        setWeeklyWorkoutDays(completed.filter(Boolean).length);
      }
    } catch (e) {
      console.error('Failed to fetch weekly workout days', e);
      setWeeklyWorkoutDays(0);
    }
  }, [user]);

  const fetchRoutines = useCallback(async () => {
    if (!user) return;
    try {
      const data = await routineStorage.getAll(user.id);
      setRoutines(data);
    } catch (e) {
      console.error('Failed to fetch routines', e);
    }
  }, [user]);

  const fetchLatestPR = useCallback(async () => {
    if (!user) return;
    try {
      const pr = await prsApi.getLatest(user.id);
      setLatestPR(pr);
    } catch (e) {
      console.error('Failed to fetch PR', e);
      setLatestPR(null);
    }
  }, [user]);

  const handleSelectRoutine = async (routine: RoutineTemplate) => {
    if (!user) return;
    
    try {
      const today = todayKey;
      
      // 루틴의 모든 운동을 오늘 날짜에 추가
      for (const exercise of routine.exercises) {
        const record = await recordsApi.create({
          userId: user.id,
          exerciseId: exercise.exerciseId,
          date: today,
        });
        
        // 세트 정보가 있으면 함께 생성
        if (exercise.sets && exercise.sets.length > 0) {
          for (let i = 0; i < exercise.sets.length; i++) {
            const set = exercise.sets[i];
            await recordsApi.addSet(record.id, {
              setNumber: i + 1,
              weight: set.weight,
              reps: set.reps,
              restTime: set.restTime,
            });
          }
        }
        
        // 루틴 불러오기는 계획 설정이므로 완료 상태를 false로 설정 (모든 레코드)
        await recordsApi.updateComplete(record.id, false);
      }
      
      // 데이터 새로고침
      await fetchToday();
      setRoutineModalVisible(false);
      
      // 운동 수행 페이지로 이동
      router.push('/workout');
    } catch (e) {
      console.error('Failed to add routine', e);
      Alert.alert('오류', '루틴 추가에 실패했습니다.');
    }
  };


  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchToday();
      fetchWeeklyWorkoutDays();
      checkWorkoutCompleted();
      fetchRoutines();
      fetchLatestPR();
    }, [fetchToday, fetchWeeklyWorkoutDays, checkWorkoutCompleted, fetchRoutines, fetchLatestPR])
  );

  const formattedDate = currentDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const hour = currentDate.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '좋은 오후에요' : '좋은 저녁에요';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.greeting}>
            {greeting}, {user?.name || '사용자'}님
          </Text>
        </View>

        {/* 3대 중량 요약 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>나의 3대 중량 (PR)</Text>
          <View style={styles.prCard}>
            <View style={styles.prGrid}>
              <View style={styles.prGridItem}>
                <Text style={styles.prLabel}>Squat</Text>
                <View style={styles.prValueRow}>
                  <Text style={styles.prValue}>{latestPR?.squat || 0}</Text>
                  <Text style={styles.prUnit}>kg</Text>
                </View>
              </View>
              <View style={styles.prGridItem}>
                <Text style={styles.prLabel}>Bench</Text>
                <View style={styles.prValueRow}>
                  <Text style={styles.prValue}>{latestPR?.bench || 0}</Text>
                  <Text style={styles.prUnit}>kg</Text>
                </View>
              </View>
              <View style={styles.prGridItem}>
                <Text style={styles.prLabel}>Deadlift</Text>
                <View style={styles.prValueRow}>
                  <Text style={styles.prValue}>{latestPR?.deadlift || 0}</Text>
                  <Text style={styles.prUnit}>kg</Text>
                </View>
              </View>
            </View>

            <View style={styles.prTotalRow}>
              <Text style={styles.prTotalLabel}>Total</Text>
              <View style={styles.prTotalValueRow}>
                <Text style={styles.prTotalValue}>
                  {(latestPR?.squat || 0) + (latestPR?.bench || 0) + (latestPR?.deadlift || 0)}
                </Text>
                <Text style={styles.prTotalUnit}>kg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 이번 주 운동 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 주 운동</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekStats}>
              <View style={styles.weekNumberContainer}>
                <Text style={styles.weekNumber}>{weeklyWorkoutDays}</Text>
              </View>
              <View style={styles.weekTextContainer}>
                <Text style={styles.weekText}>이번 주는 총 {weeklyWorkoutDays}일 운동했습니다</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 오늘의 운동 루틴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 루틴</Text>
          {isLoading ? (
            <View style={styles.routineCard}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={[styles.emptyText, { marginTop: 8 }]}>불러오는 중...</Text>
              </View>
            </View>
          ) : todayRecords.length > 0 ? (
            <>
              <View style={styles.routineCard}>
                {/* 오늘의 부위 헤더 */}
                {(() => {
                  // 부위 목록 추출
                  const bodyParts = Array.from(
                    new Set(todayRecords.map(r => r.exercise?.category).filter(Boolean))
                  ) as string[];
                  
                  const bodyPartsText = bodyParts.length === 1 
                    ? bodyParts[0]
                    : bodyParts.join(' & ');
                  
                  return (
                    <View style={styles.routineHeaderSection}>
                      <Text style={styles.routineHeaderText}>
                        오늘의 부위 - {bodyPartsText}
                      </Text>
                    </View>
                  );
                })()}
                
                {(() => {
                  // 부위별로 그룹화
                  const BODY_PARTS = ['가슴', '등', '하체', '어깨', '팔'];
                  type RecordType = typeof todayRecords[0];
                  
                  const groupedRecords = todayRecords.reduce((acc: { [key: string]: RecordType[] }, record: RecordType) => {
                    const category = record.exercise?.category || '기타';
                    if (!acc[category]) {
                      acc[category] = [];
                    }
                    acc[category].push(record);
                    return acc;
                  }, {});

                  // BODY_PARTS 순서대로 정렬
                  const sortedCategories = Object.keys(groupedRecords).sort((a, b) => {
                    const indexA = BODY_PARTS.indexOf(a);
                    const indexB = BODY_PARTS.indexOf(b);
                    if (indexA === -1 && indexB === -1) return a.localeCompare(b, 'ko');
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                  });

                  let globalIndex = 0;
                  
                  return sortedCategories.map((category, catIdx) => (
                    <View key={category}>
                      {catIdx > 0 && <View style={styles.categoryDivider} />}
                      <View style={styles.categoryLabelContainer}>
                        <Dumbbell color={Colors.primary} size={14} />
                        <Text style={styles.categoryLabel}>{category}</Text>
                      </View>
                      {groupedRecords[category].map((record: RecordType, idx: number) => {
                        const currentIndex = globalIndex++;
                        return (
                          <View key={record.id || idx}>
                            <View style={styles.routineItem}>
                              <View style={styles.routineNumber}>
                                <Text style={styles.routineNumberText}>{currentIndex + 1}</Text>
                              </View>
                              <View style={styles.routineContent}>
                                <Text style={styles.routineName}>{record.exercise?.name || '운동'}</Text>
                                <Text style={styles.routineDetail}>
                                  {record.sets?.length ? `${record.sets.length}세트` : '기록 없음'}
                                </Text>
                              </View>
                            </View>
                            {idx < groupedRecords[category].length - 1 && (
                              <View style={styles.routineDivider} />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>
              {isWorkoutCompleted ? (
                <View style={styles.completedButtonsRow}>
                  <View style={styles.completedBadge}>
                    <Check color={Colors.success} size={20} />
                    <Text style={styles.completedBadgeText}>운동 완료</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.anotherWorkoutButton}
                    onPress={() => setRoutineModalVisible(true)}
                  >
                    <Dumbbell color="#fff" size={18} />
                    <Text style={styles.anotherWorkoutButtonText}>다른 운동 시작하기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => router.push('/workout')}
                >
                  <Dumbbell color="#fff" size={20} />
                  <Text style={styles.startButtonText}>운동 시작하기</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.routineCard}>
              <Text style={styles.emptyText}>아직 등록된 루틴이 없습니다.</Text>
              <Text style={[styles.emptyText, { marginTop: 6 }]}>
                루틴 탭에서 날짜를 선택해 루틴을 추가해 보세요.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 루틴 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={routineModalVisible}
        onRequestClose={() => setRoutineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>루틴 선택</Text>
              <TouchableOpacity onPress={() => setRoutineModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            
            {routines.length > 0 ? (
              <FlatList
                data={routines}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  // 부위 목록 추출
                  const categories = Array.from(
                    new Set(item.exercises.map(e => e.category))
                  );
                  const categoryText = categories.join(' & ');
                  
                  return (
                    <TouchableOpacity
                      style={styles.routineSelectItem}
                      onPress={() => handleSelectRoutine(item)}
                    >
                      <View style={styles.routineSelectIcon}>
                        <ListOrdered color={Colors.primary} size={20} />
                      </View>
                      <View style={styles.routineSelectContent}>
                        <Text style={styles.routineSelectName}>
                          {item.name}
                        </Text>
                        <Text style={styles.routineSelectDetail}>
                          {categoryText} • {item.exercises.length}개 운동
                        </Text>
                      </View>
                      <ChevronRight color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.routineSelectDivider} />}
              />
            ) : (
              <View style={styles.modalEmptyContainer}>
                <Text style={styles.modalEmptyText}>
                  저장된 루틴이 없습니다.
                </Text>
                <Text style={styles.modalEmptySubText}>
                  루틴 탭에서 루틴을 추가해주세요.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  // PR Card Styles
  prCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  prGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  prGridItem: {
    flex: 1,
    gap: 4,
  },
  prLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  prValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  prValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  prUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  prTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '80', // 50% opacity
  },
  prTotalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  prTotalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  prTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  prTotalUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  // Routine Styles
  routineCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routineHeaderSection: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  routineHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  categoryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  routineDivider: {
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  routineNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '1A', // primary/10
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  routineContent: {
    flex: 1,
    gap: 4,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  routineDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Week Stats Styles
  weekCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weekStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: Colors.primary + '1A', // accent/10
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  weekTextContainer: {
    flex: 1,
  },
  weekText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  // 운동 완료 버튼 스타일
  completedButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  completedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success + '15',
    borderRadius: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.success + '30',
  },
  completedBadgeText: {
    color: Colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
  anotherWorkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  anotherWorkoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  routineSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  routineSelectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineSelectContent: {
    flex: 1,
    gap: 4,
  },
  routineSelectName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  routineSelectDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  routineSelectDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  modalEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  modalEmptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
