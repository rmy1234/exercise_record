import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Colors } from '../../constants/Colors';
import { Plus, X, ChevronRight, Dumbbell, ChevronDown, ChevronLeft, Calendar as CalendarIcon, Trash2, Edit2, ListOrdered, Check, GripVertical } from 'lucide-react-native';
import { exercisesApi, recordsApi } from '../../services/api';
import { Exercise, Record, RecordSet, RoutineTemplate, CreateRoutineTemplateRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { routineStorage } from '../../services/routineStorage';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 캘린더 한글 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

const BODY_PARTS = ['가슴', '등', '하체', '어깨', '팔'];

export default function RoutinesScreen() {
  const { user } = useAuth();
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'calendar' | 'routines'>('calendar');
  
  // 날짜별 운동 관련 상태
  const [selectedDate, setSelectedDate] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // YYYY-MM 형식
  const [dailyRecords, setDailyRecords] = useState<Record[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [step, setStep] = useState<'PART' | 'EXERCISE'>('PART');
  const [selectedPart, setSelectedPart] = useState('');
  
  // 커스텀 운동 추가 상태
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // 세트 입력 모달 상태
  const [setsModalVisible, setSetsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [sets, setSets] = useState<{ weight: string; reps: string; restTime?: string; id?: string }[]>([]);

  // 연도/월 선택 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const yearScrollRef = useRef<ScrollView | null>(null);
  const monthScrollRef = useRef<ScrollView | null>(null);
  const routineModalScrollRef = useRef<ScrollView | null>(null);
  const routineModalScrollPosition = useRef<number>(0);

  // 루틴 템플릿 관련 상태
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [routineModalVisible, setRoutineModalVisible] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [selectedExercisesForRoutine, setSelectedExercisesForRoutine] = useState<{ exerciseId: string; exerciseName: string; category: string; sets?: { weight: number; reps: number; restTime?: number; }[] }[]>([]);
  const [editingRoutine, setEditingRoutine] = useState<RoutineTemplate | null>(null);
  const [editingRoutineExercise, setEditingRoutineExercise] = useState<{ exerciseId: string; exerciseName: string } | null>(null);
  
  // 루틴 불러오기 모달
  const [loadRoutineModalVisible, setLoadRoutineModalVisible] = useState(false);
  
  // 전체 선택 및 삭제 상태
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  useEffect(() => {
    // 오늘 날짜로 초기화
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchExercises();
  }, []);

  useEffect(() => {
    // user가 로드되면 루틴 불러오기
    if (user) {
      fetchRoutines();
    }
  }, [user]);

  useEffect(() => {
    if (selectedDate && user) {
      fetchDailyRecords(selectedDate);
    }
  }, [selectedDate, user]);

  useEffect(() => {
    // currentMonth 변경 시 selectedYear와 selectedMonth 동기화
    if (currentMonth) {
      const date = new Date(currentMonth + '-01');
      setSelectedYear(date.getFullYear());
      setSelectedMonth(date.getMonth() + 1);
    }
  }, [currentMonth]);

  const fetchExercises = async () => {
    try {
      const data = await exercisesApi.getAll();
      // 가나다순으로 정렬
      const sortedExercises = data.sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', 'ko')
      );
      setExercises(sortedExercises);
    } catch (e) {
      console.error('Failed to fetch exercises', e);
    }
  };

  const fetchDailyRecords = async (date: string) => {
    if (!user) return;
    try {
      const data = await recordsApi.getByDate(user.id, date);
      setDailyRecords(data);
    } catch (e) {
      console.error('Failed to fetch records', e);
    }
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: any) => {
    const dateStr = month.dateString.substring(0, 7); // YYYY-MM
    setCurrentMonth(dateStr);
    setSelectedYear(month.year);
    setSelectedMonth(month.month);
  };

  const openDatePicker = () => {
    // 현재 캘린더에 표시된 연도/월로 초기화
    const current = new Date(currentMonth + '-01');
    setSelectedYear(current.getFullYear());
    setSelectedMonth(current.getMonth() + 1);
    setDatePickerVisible(true);
  };

  const handlePrevMonth = () => {
    const current = new Date(currentMonth + '-01');
    current.setMonth(current.getMonth() - 1);
    const newMonth = current.toISOString().split('T')[0].substring(0, 7);
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    
    setCurrentMonth(newMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleNextMonth = () => {
    const current = new Date(currentMonth + '-01');
    current.setMonth(current.getMonth() + 1);
    const newMonth = current.toISOString().split('T')[0].substring(0, 7);
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    
    setCurrentMonth(newMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleDateSelect = () => {
    const newDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const newMonth = newDate.substring(0, 7);
    setCurrentMonth(newMonth);
    setDatePickerVisible(false);
    // 선택한 날짜가 있으면 유지, 없으면 해당 월의 첫 날로 설정
    if (!selectedDate || !selectedDate.startsWith(newMonth)) {
      setSelectedDate(newDate);
    }
  };

  const openAddModal = () => {
    setStep('PART');
    setSelectedPart('');
    setCustomExerciseName('');
    setIsAddingCustom(false);
    setModalVisible(true);
  };

  const handlePartSelect = (part: string) => {
    setSelectedPart(part);
    setStep('EXERCISE');
  };

  const handleExerciseSelect = async (exercise: Exercise) => {
    if (!user || !selectedDate) return;

    try {
      // 운동을 루틴에 추가
      const record = await recordsApi.create({
        userId: user.id,
        exerciseId: exercise.id,
        date: selectedDate,
      });
      
      // 저장된 세트 정보가 있으면 자동으로 추가
      const savedSets = await loadSavedSets(exercise.id);
      if (savedSets && savedSets.length > 0) {
        for (let i = 0; i < savedSets.length; i++) {
          const set = savedSets[i];
          await recordsApi.addSet(record.id, {
            setNumber: i + 1,
            weight: set.weight,
            reps: set.reps,
            restTime: set.restTime,
          });
        }
        // 운동 추가는 계획 설정이므로 완료 상태를 false로 설정
        await recordsApi.updateComplete(record.id, false);
      }
      
      // 루틴 목록 새로고침
      await fetchDailyRecords(selectedDate);
      
      // 성공 피드백
      if (Platform.OS === 'web') {
        // Web에서는 조용히 추가
      } else {
        // 모바일에서는 간단한 토스트 메시지 (Alert 대신)
      }
      
      // 모달은 닫지 않고 계속 운동을 추가할 수 있게 함
    } catch (e) {
      if (Platform.OS === 'web') {
        alert('운동 추가에 실패했습니다.');
      } else {
        Alert.alert('오류', '운동 추가에 실패했습니다.');
      }
    }
  };

  const loadSavedSets = async (exerciseId: string): Promise<{ weight: number; reps: number; restTime?: number }[] | null> => {
    try {
      const saved = await AsyncStorage.getItem(`exercise_sets_${exerciseId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const saveSets = async (exerciseId: string, sets: { weight: number; reps: number; restTime?: number }[]) => {
    try {
      await AsyncStorage.setItem(`exercise_sets_${exerciseId}`, JSON.stringify(sets));
    } catch (e) {
      console.error('Failed to save sets', e);
    }
  };

  const openSetModal = (record: Record) => {
    setSelectedRecord(record);
    setEditingRoutineExercise(null);
    // 기존 세트가 있으면 불러오기, 없으면 빈 세트 하나 추가
    if (record.sets && record.sets.length > 0) {
      setSets(record.sets.map(set => ({
        weight: set.weight.toString(),
        reps: set.reps.toString(),
        restTime: set.restTime ? set.restTime.toString() : '',
        id: set.id,
      })));
    } else {
      // 이전 세트 정보 불러오기
      loadSavedSets(record.exerciseId!).then(savedSets => {
        if (savedSets && savedSets.length > 0) {
          setSets(savedSets.map(set => ({
            weight: set.weight.toString(),
            reps: set.reps.toString(),
            restTime: set.restTime ? set.restTime.toString() : '',
          })));
        } else {
          setSets([{ weight: '', reps: '', restTime: '' }]);
        }
      });
    }
    setSetsModalVisible(true);
  };

  const openRoutineExerciseSetModal = async (exercise: { exerciseId: string; exerciseName: string; category: string; sets?: { weight: number; reps: number; restTime?: number; }[] }) => {
    setSelectedRecord(null);
    setEditingRoutineExercise({ exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseName });
    // 기존 세트가 있으면 불러오기, 없으면 저장된 세트 정보 불러오기
    if (exercise.sets && exercise.sets.length > 0) {
      setSets(exercise.sets.map(set => ({
        weight: set.weight.toString(),
        reps: set.reps.toString(),
        restTime: set.restTime ? set.restTime.toString() : '',
      })));
    } else {
      // 저장된 세트 정보 불러오기
      const savedSets = await loadSavedSets(exercise.exerciseId);
      if (savedSets && savedSets.length > 0) {
        setSets(savedSets.map(set => ({
          weight: set.weight.toString(),
          reps: set.reps.toString(),
          restTime: set.restTime ? set.restTime.toString() : '',
        })));
      } else {
        setSets([{ weight: '', reps: '', restTime: '' }]);
      }
    }
    // 루틴 모달을 일시적으로 숨기고 세트 모달 열기
    setRoutineModalVisible(false);
    setSetsModalVisible(true);
  };

  const handleDeleteRecord = async (recordId: string, exerciseName: string) => {
    const deleteRecord = async () => {
      try {
        await recordsApi.delete(recordId);
        await fetchDailyRecords(selectedDate);
        if (Platform.OS === 'web') {
          alert('운동이 삭제되었습니다.');
        } else {
          Alert.alert('성공', '운동이 삭제되었습니다.');
        }
      } catch (e) {
        console.error('Delete record error', e);
        if (Platform.OS === 'web') {
          alert('운동 삭제에 실패했습니다.');
        } else {
          Alert.alert('오류', '운동 삭제에 실패했습니다.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${exerciseName}을(를) 삭제하시겠습니까?`)) {
        deleteRecord();
      }
    } else {
      Alert.alert(
        '운동 삭제',
        `${exerciseName}을(를) 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: deleteRecord,
          },
        ]
      );
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedRecordIds.length === dailyRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(dailyRecords.map(r => r.id));
    }
  };

  // 개별 선택/해제
  const handleToggleRecord = (recordId: string) => {
    setSelectedRecordIds(prev => 
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    );
  };

  // 선택된 항목 일괄 삭제
  const handleDeleteSelected = async () => {
    if (selectedRecordIds.length === 0) return;

    const deleteSelected = async () => {
      try {
        // 선택된 모든 레코드 삭제
        await Promise.all(selectedRecordIds.map(id => recordsApi.delete(id)));
        await fetchDailyRecords(selectedDate);
        setSelectedRecordIds([]);
        setIsSelectionMode(false);
        
        if (Platform.OS === 'web') {
          alert(`${selectedRecordIds.length}개의 운동이 삭제되었습니다.`);
        } else {
          Alert.alert('성공', `${selectedRecordIds.length}개의 운동이 삭제되었습니다.`);
        }
      } catch (e) {
        console.error('Delete selected records error', e);
        if (Platform.OS === 'web') {
          alert('운동 삭제에 실패했습니다.');
        } else {
          Alert.alert('오류', '운동 삭제에 실패했습니다.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`선택한 ${selectedRecordIds.length}개의 운동을 삭제하시겠습니까?`)) {
        deleteSelected();
      }
    } else {
      Alert.alert(
        '운동 삭제',
        `선택한 ${selectedRecordIds.length}개의 운동을 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: deleteSelected,
          },
        ]
      );
    }
  };

  // 운동 순서 변경 (날짜별 운동 - 부위별)
  const handleReorderDailyRecordsByCategory = async (category: string, newData: Record[]) => {
    // 해당 부위의 운동들만 업데이트
    const otherRecords = dailyRecords.filter(r => (r.exercise?.category || '기타') !== category);
    
    // 부위별로 그룹화
    const groupedRecords: { [key: string]: Record[] } = {};
    otherRecords.forEach(record => {
      const cat = record.exercise?.category || '기타';
      if (!groupedRecords[cat]) {
        groupedRecords[cat] = [];
      }
      groupedRecords[cat].push(record);
    });
    
    // 업데이트된 부위 추가
    groupedRecords[category] = newData;
    
    // BODY_PARTS 순서대로 정렬
    const sortedCategories = Object.keys(groupedRecords).sort((a, b) => {
      const indexA = BODY_PARTS.indexOf(a);
      const indexB = BODY_PARTS.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b, 'ko');
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    // 전체 순서 재구성
    const updatedRecords: Record[] = [];
    sortedCategories.forEach(cat => {
      updatedRecords.push(...groupedRecords[cat]);
    });
    
    setDailyRecords(updatedRecords);
    
    try {
      // 서버에 순서 업데이트
      for (let i = 0; i < updatedRecords.length; i++) {
        await recordsApi.updateOrder(updatedRecords[i].id, i);
      }
    } catch (e) {
      console.error('Failed to update order', e);
      // 실패 시 다시 불러오기
      await fetchDailyRecords(selectedDate);
    }
  };

  const handleSaveSets = async () => {
    // 루틴 운동의 세트 저장
    if (editingRoutineExercise) {
      try {
        const validSets = sets
          .filter(set => set.weight && set.reps)
          .map(set => ({
            weight: parseFloat(set.weight),
            reps: parseInt(set.reps, 10),
            restTime: set.restTime ? parseInt(set.restTime, 10) : undefined,
          }));
        
        // 세트 정보를 AsyncStorage에 저장 (가장 최근 정보로 덮어쓰기)
        if (validSets.length > 0 && editingRoutineExercise.exerciseId) {
          await saveSets(editingRoutineExercise.exerciseId, validSets);
        }
        
        setSelectedExercisesForRoutine(prev =>
          prev.map(e =>
            e.exerciseId === editingRoutineExercise.exerciseId
              ? { ...e, sets: validSets.length > 0 ? validSets : undefined }
              : e
          )
        );
        
        setSetsModalVisible(false);
        setEditingRoutineExercise(null);
        // 루틴 모달 다시 열기
        setRoutineModalVisible(true);
        // 스크롤 위치 복원
        setTimeout(() => {
          if (routineModalScrollRef.current) {
            routineModalScrollRef.current.scrollTo({
              y: routineModalScrollPosition.current,
              animated: false,
            });
          }
        }, 100);
      } catch (e) {
        console.error('Failed to save sets for routine exercise', e);
        Alert.alert('오류', '세트 저장에 실패했습니다.');
      }
      return;
    }

    // 날짜별 운동의 세트 저장
    if (!selectedRecord || !user || !selectedDate) return;

    try {
      // 빈 세트 제거
      const validSets = sets.filter(set => set.weight && set.reps);
      
      if (validSets.length === 0) {
        Alert.alert('알림', '최소 1개 이상의 세트를 입력해주세요.');
        return;
      }

      // 기존 세트 ID 매핑
      const existingSets = selectedRecord.sets || [];
      const existingSetIds = existingSets.map(s => s.id).filter(Boolean) as string[];

      // 기존 세트 중 사용하지 않는 것 삭제
      const usedSetIds = validSets.map(s => s.id).filter(Boolean) as string[];
      for (const setId of existingSetIds) {
        if (!usedSetIds.includes(setId)) {
          await recordsApi.deleteSet(setId);
        }
      }

      // 세트 업데이트 및 추가
      for (let i = 0; i < validSets.length; i++) {
        const set = validSets[i];
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps, 10);
        const restTime = set.restTime ? parseInt(set.restTime, 10) : undefined;

        if (set.id && existingSetIds.includes(set.id)) {
          // 기존 세트 수정
          await recordsApi.updateSet(set.id, {
            weight,
            reps,
            restTime,
          });
        } else {
          // 새 세트 추가
          await recordsApi.addSet(selectedRecord.id, {
            setNumber: i + 1,
            weight,
            reps,
            restTime,
          });
        }
      }

      // 세트 정보 저장 (다음에 자동으로 불러오기 위해)
      if (validSets.length > 0 && selectedRecord.exerciseId) {
        await saveSets(selectedRecord.exerciseId, validSets.map(set => ({
          weight: parseFloat(set.weight),
          reps: parseInt(set.reps, 10),
          restTime: set.restTime ? parseInt(set.restTime, 10) : undefined,
        })));
      }

      await fetchDailyRecords(selectedDate);
      setSetsModalVisible(false);
      Alert.alert('성공', '세트가 저장되었습니다.');
    } catch (e) {
      console.error('Save sets error', e);
      Alert.alert('오류', '세트 저장에 실패했습니다.');
    }
  };

  const handleAddCustomExercise = async () => {
    if (!customExerciseName || !selectedPart) return;

    try {
      const newExercise = await exercisesApi.create({
        name: customExerciseName,
        category: selectedPart,
      });

      // 운동 목록 새로고침
      await fetchExercises();
      
      // 루틴에 추가
      await handleExerciseSelect(newExercise);
      
      // 입력 폼 초기화
      setCustomExerciseName('');
      setIsAddingCustom(false);
    } catch (e) {
      if (Platform.OS === 'web') {
        alert('운동 추가에 실패했습니다.');
      } else {
        Alert.alert('오류', '운동 추가에 실패했습니다.');
      }
    }
  };

  const filteredExercises = exercises
    .filter(ex => ex.category === selectedPart)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));

  // 루틴 관련 함수들
  const fetchRoutines = async () => {
    if (!user) return;
    try {
      const data = await routineStorage.getAll(user.id);
      setRoutines(data);
    } catch (e) {
      console.error('Failed to fetch routines', e);
    }
  };

  const openRoutineModal = () => {
    setRoutineName('');
    setSelectedExercisesForRoutine([]);
    setEditingRoutine(null);
    setStep('PART');
    setSelectedPart('');
    setRoutineModalVisible(true);
  };

  const openEditRoutineModal = (routine: RoutineTemplate) => {
    setRoutineName(routine.name);
    setSelectedExercisesForRoutine(routine.exercises.map(e => ({
      ...e,
      sets: e.sets || []
    })));
    setEditingRoutine(routine);
    setStep('PART');
    setSelectedPart('');
    setRoutineModalVisible(true);
  };

  const handleRoutineExerciseSelect = async (exercise: Exercise) => {
    const exists = selectedExercisesForRoutine.find(e => e.exerciseId === exercise.id);
    if (exists) {
      // 이미 선택된 운동은 제거
      setSelectedExercisesForRoutine(prev => prev.filter(e => e.exerciseId !== exercise.id));
    } else {
      // 저장된 세트 정보 불러오기
      const savedSets = await loadSavedSets(exercise.id);
      
      // 새 운동 추가 (저장된 세트 정보가 있으면 포함)
      setSelectedExercisesForRoutine(prev => [...prev, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        sets: savedSets && savedSets.length > 0 ? savedSets : undefined,
      }]);
    }
  };

  const handleSaveRoutine = async () => {
    if (!user) return;
    if (!routineName.trim()) {
      Alert.alert('알림', '루틴 이름을 입력해주세요.');
      return;
    }
    if (selectedExercisesForRoutine.length === 0) {
      Alert.alert('알림', '최소 1개 이상의 운동을 선택해주세요.');
      return;
    }

    try {
      // 세트 정보 정리 (유효한 세트만 저장)
      const exercisesWithValidSets = selectedExercisesForRoutine.map(exercise => ({
        ...exercise,
        sets: exercise.sets && exercise.sets.length > 0 
          ? exercise.sets.filter(set => set.weight > 0 && set.reps > 0)
          : undefined
      }));

      if (editingRoutine) {
        // 수정
        await routineStorage.update(user.id, editingRoutine.id, {
          name: routineName,
          exercises: exercisesWithValidSets,
        });
        Alert.alert('성공', '루틴이 수정되었습니다.');
      } else {
        // 생성
        await routineStorage.create(user.id, {
          name: routineName,
          exercises: exercisesWithValidSets,
        });
        Alert.alert('성공', '루틴이 생성되었습니다.');
      }
      
      await fetchRoutines();
      setRoutineModalVisible(false);
    } catch (e) {
      Alert.alert('오류', '루틴 저장에 실패했습니다.');
    }
  };

  const handleDeleteRoutine = async (routineId: string, routineName: string) => {
    if (!user) return;
    
    const deleteRoutine = async () => {
      try {
        await routineStorage.delete(user.id, routineId);
        await fetchRoutines();
        Alert.alert('성공', '루틴이 삭제되었습니다.');
      } catch (e) {
        Alert.alert('오류', '루틴 삭제에 실패했습니다.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${routineName}을(를) 삭제하시겠습니까?`)) {
        deleteRoutine();
      }
    } else {
      Alert.alert(
        '루틴 삭제',
        `${routineName}을(를) 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: deleteRoutine,
          },
        ]
      );
    }
  };

  const handleLoadRoutine = async (routine: RoutineTemplate) => {
    if (!user || !selectedDate) return;
    
    try {
      // 루틴의 모든 운동을 선택된 날짜에 추가
      for (const exercise of routine.exercises) {
        const record = await recordsApi.create({
          userId: user.id,
          exerciseId: exercise.exerciseId,
          date: selectedDate,
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
        } else {
          // 루틴에 세트 정보가 없으면 저장된 세트 정보가 있으면 자동으로 추가
          const savedSets = await loadSavedSets(exercise.exerciseId);
          if (savedSets && savedSets.length > 0) {
            for (let i = 0; i < savedSets.length; i++) {
              const set = savedSets[i];
              await recordsApi.addSet(record.id, {
                setNumber: i + 1,
                weight: set.weight,
                reps: set.reps,
                restTime: set.restTime,
              });
            }
          }
        }
        
        // 루틴 불러오기는 계획 설정이므로 완료 상태를 false로 설정 (모든 레코드)
        await recordsApi.updateComplete(record.id, false);
      }
      
      // 데이터 새로고침
      await fetchDailyRecords(selectedDate);
      setLoadRoutineModalVisible(false);
      
      if (Platform.OS === 'web') {
        alert(`${routine.name} 루틴이 추가되었습니다.`);
      } else {
        Alert.alert('성공', `${routine.name} 루틴이 추가되었습니다.`);
      }
    } catch (e) {
      console.error('Failed to load routine', e);
      if (Platform.OS === 'web') {
        alert('루틴 불러오기에 실패했습니다.');
      } else {
        Alert.alert('오류', '루틴 불러오기에 실패했습니다.');
      }
    }
  };

  // 연도 목록: 2025~2030
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const PICKER_ITEM_HEIGHT = 48;

  // 드롭다운 열릴 때 선택된 연/월 위치로 스크롤
  useEffect(() => {
    if (!datePickerVisible) return;
    const yearIndex = Math.max(0, years.indexOf(selectedYear));
    const monthIndex = Math.max(0, selectedMonth - 1);
    setTimeout(() => {
      yearScrollRef.current?.scrollTo({
        y: yearIndex * PICKER_ITEM_HEIGHT,
        animated: false,
      });
      monthScrollRef.current?.scrollTo({
        y: monthIndex * PICKER_ITEM_HEIGHT,
        animated: false,
      });
    }, 0);
  }, [datePickerVisible, selectedYear, selectedMonth]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>루틴</Text>
        
        {/* 탭 컨트롤 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
            onPress={() => setActiveTab('calendar')}
          >
            <CalendarIcon color={activeTab === 'calendar' ? Colors.primary : Colors.textSecondary} size={20} />
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>
              날짜별 운동
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'routines' && styles.tabActive]}
            onPress={() => setActiveTab('routines')}
          >
            <ListOrdered color={activeTab === 'routines' ? Colors.primary : Colors.textSecondary} size={20} />
            <Text style={[styles.tabText, activeTab === 'routines' && styles.tabTextActive]}>
              루틴 관리
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'calendar' ? (
          <>
            <Calendar
          key={currentMonth}
          current={currentMonth}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={{
            [selectedDate]: { 
              selected: true, 
              selectedColor: Colors.primary,
              selectedTextColor: '#FFFFFF',
            },
          }}
          theme={{
            todayTextColor: Colors.primary,
            arrowColor: 'transparent', // 기본 화살표 숨김
            monthTextColor: 'transparent', // 기본 월 텍스트 숨김
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 16,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: '#FFFFFF',
          }}
          style={styles.calendar}
          hideArrows={true}
          renderHeader={(date: any) => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            return (
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.headerArrowLeft}>
                  <ChevronLeft color={Colors.text} size={24} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerDateButton}
                  onPress={openDatePicker}
                >
                  <Text style={styles.headerDateText}>
                    {year}년 {month}월
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextMonth} style={styles.headerArrowRight}>
                  <ChevronRight color={Colors.text} size={24} />
                </TouchableOpacity>
              </View>
            );
          }}
        />

        <View style={styles.routinesContainer}>
          <View style={styles.routinesHeaderContainer}>
            <Text style={styles.dateTitle}>{selectedDate} 루틴</Text>
            <View style={styles.headerButtons}>
              {isSelectionMode ? (
                <>
                  <TouchableOpacity 
                    style={styles.selectAllButton} 
                    onPress={handleSelectAll}
                  >
                    <Check 
                      color={selectedRecordIds.length === dailyRecords.length ? Colors.primary : Colors.textSecondary} 
                      size={20} 
                    />
                    <Text style={[
                      styles.selectAllButtonText,
                      selectedRecordIds.length === dailyRecords.length && styles.selectAllButtonTextActive
                    ]}>
                      전체 선택
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.deleteSelectedButton, selectedRecordIds.length === 0 && styles.deleteSelectedButtonDisabled]} 
                    onPress={handleDeleteSelected}
                    disabled={selectedRecordIds.length === 0}
                  >
                    <Trash2 color="#fff" size={18} />
                    <Text style={styles.deleteSelectedButtonText}>
                      삭제 ({selectedRecordIds.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelSelectionButton} 
                    onPress={() => {
                      setIsSelectionMode(false);
                      setSelectedRecordIds([]);
                    }}
                  >
                    <X color="#fff" size={18} />
                    <Text style={styles.cancelSelectionButtonText}>취소</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.loadRoutineButton} onPress={() => setLoadRoutineModalVisible(true)}>
                    <ListOrdered color="#fff" size={20} />
                    <Text style={styles.loadRoutineButtonText}>루틴 불러오기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Plus color="#fff" size={20} />
                    <Text style={styles.addButtonText}>운동 추가</Text>
                  </TouchableOpacity>
                  {dailyRecords.length > 0 && (
                    <TouchableOpacity 
                      style={styles.selectionModeButton} 
                      onPress={() => setIsSelectionMode(true)}
                    >
                      <Check color="#fff" size={18} />
                      <Text style={styles.selectionModeButtonText}>선택</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          {dailyRecords.length > 0 ? (
            <View style={styles.recordList}>
              {(() => {
                // 부위별로 운동 그룹화
                type RecordType = typeof dailyRecords[0];
                const groupedRecords = dailyRecords.reduce((acc: { [key: string]: RecordType[] }, record: RecordType) => {
                  const category = record.exercise?.category || '기타';
                  if (!acc[category]) {
                    acc[category] = [];
                  }
                  acc[category].push(record);
                  return acc;
                }, {});

                // BODY_PARTS 순서대로 정렬 (그 외는 뒤로)
                const sortedCategories = Object.keys(groupedRecords).sort((a, b) => {
                  const indexA = BODY_PARTS.indexOf(a);
                  const indexB = BODY_PARTS.indexOf(b);
                  if (indexA === -1 && indexB === -1) return a.localeCompare(b, 'ko');
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                });

                let globalIndex = 0;
                
                return sortedCategories.map(category => (
                  <View key={category} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryIconContainer}>
                        <Dumbbell color={Colors.primary} size={18} />
                      </View>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      <View style={styles.categoryDivider} />
                    </View>
                    <GestureHandlerRootView>
                      <DraggableFlatList
                        data={groupedRecords[category]}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        onDragEnd={({ data }) => handleReorderDailyRecordsByCategory(category, data)}
                        renderItem={({ item: record, drag, isActive, getIndex }: RenderItemParams<RecordType>) => {
                          const currentIndex = globalIndex++;
                          return (
                            <ScaleDecorator>
                              <View style={[
                                styles.recordCard,
                                isActive && styles.recordCardActive
                              ]}>
                                <TouchableOpacity 
                                  style={styles.dragHandle}
                                  onLongPress={Platform.OS !== 'web' ? drag : undefined}
                                  onPressIn={Platform.OS === 'web' ? drag : undefined}
                                  disabled={isActive}
                                >
                                  <GripVertical color={Colors.textSecondary} size={20} />
                                </TouchableOpacity>
                                {isSelectionMode ? (
                                  <TouchableOpacity 
                                    style={styles.recordItemContainer}
                                    onPress={() => handleToggleRecord(record.id)}
                                  >
                                    <View style={styles.recordItem}>
                                      <View style={[
                                        styles.checkbox,
                                        selectedRecordIds.includes(record.id) && styles.checkboxChecked
                                      ]}>
                                        {selectedRecordIds.includes(record.id) && (
                                          <Check color="#fff" size={14} />
                                        )}
                                      </View>
                                      <View style={styles.recordContent}>
                                        <Text style={styles.recordName}>{record.exercise?.name || '알 수 없는 운동'}</Text>
                                        <Text style={styles.recordCategory}>
                                          {record.sets && record.sets.length > 0 
                                            ? `${record.sets.length}세트 - ${record.sets.map((s: RecordSet) => `${s.weight}kg × ${s.reps}회`).join(' · ')}`
                                            : '기록 없음'}
                                        </Text>
                                      </View>
                                    </View>
                                  </TouchableOpacity>
                                ) : (
                                  <>
                                    <TouchableOpacity 
                                      style={styles.recordItemContainer}
                                      onPress={() => !isActive && openSetModal(record)}
                                      onLongPress={Platform.OS === 'web' ? drag : undefined}
                                    >
                                      <View style={styles.recordItem}>
                                        <View style={styles.recordNumber}>
                                          <Text style={styles.recordNumberText}>{currentIndex + 1}</Text>
                                        </View>
                                        <View style={styles.recordContent}>
                                          <Text style={styles.recordName}>{record.exercise?.name || '알 수 없는 운동'}</Text>
                                          <Text style={styles.recordCategory}>
                                            {record.sets && record.sets.length > 0 
                                              ? `${record.sets.length}세트 - ${record.sets.map((s: RecordSet) => `${s.weight}kg × ${s.reps}회`).join(' · ')}`
                                              : '기록 없음'}
                                          </Text>
                                        </View>
                                      </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.deleteRecordButton}
                                      onPress={() => handleDeleteRecord(record.id, record.exercise?.name || '운동')}
                                    >
                                      <Trash2 color={Colors.danger} size={20} />
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
                            </ScaleDecorator>
                          );
                        }}
                      />
                    </GestureHandlerRootView>
                  </View>
                ));
              })()}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 운동이 없습니다.</Text>
              <Text style={styles.emptySubText}>'운동 추가' 버튼을 눌러 루틴을 만들어보세요.</Text>
            </View>
          )}
        </View>
          </>
        ) : (
          /* 루틴 관리 탭 */
          <View style={styles.routinesManagement}>
            <View style={styles.routinesHeader}>
              <Text style={styles.routinesHeaderTitle}>나의 루틴</Text>
              <TouchableOpacity style={styles.addButton} onPress={openRoutineModal}>
                <Plus color="#fff" size={20} />
                <Text style={styles.addButtonText}>루틴 추가</Text>
              </TouchableOpacity>
            </View>

            {routines.length > 0 ? (
              <View style={styles.routinesList}>
                {routines.map((routine, index) => {
                  // 부위 목록 추출
                  const categories = Array.from(
                    new Set(routine.exercises.map(e => e.category))
                  );
                  const categoryText = categories.join(' & ');

                  return (
                    <View key={routine.id} style={styles.routineTemplateCard}>
                      <View style={styles.routineTemplateHeader}>
                        <View style={styles.routineTemplateTitleContainer}>
                          <ListOrdered color={Colors.primary} size={20} />
                          <Text style={styles.routineTemplateName}>{routine.name}</Text>
                        </View>
                        <View style={styles.routineTemplateActions}>
                          <TouchableOpacity
                            style={styles.editRoutineButton}
                            onPress={() => openEditRoutineModal(routine)}
                          >
                            <Edit2 color={Colors.primary} size={20} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteRoutineButton}
                            onPress={() => handleDeleteRoutine(routine.id, routine.name)}
                          >
                            <Trash2 color={Colors.danger} size={20} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={styles.routineTemplateCategory}>{categoryText}</Text>
                      <View style={styles.routineTemplateExercises}>
                        {routine.exercises.map((ex, idx) => (
                          <View key={idx} style={styles.routineTemplateExerciseItem}>
                            <View style={styles.routineTemplateExerciseRow}>
                              <Text style={styles.routineTemplateExerciseNumber}>{idx + 1}</Text>
                              <Text style={styles.routineTemplateExerciseName}>{ex.exerciseName}</Text>
                            </View>
                            {ex.sets && ex.sets.length > 0 && (
                              <View style={styles.routineTemplateSetsContainer}>
                                <Text style={styles.routineTemplateSetText}>
                                  {ex.sets.length}세트 - {ex.sets.map((set, setIdx) => (
                                    <Text key={setIdx}>
                                      {set.weight}kg × {set.reps}회
                                      {setIdx < ex.sets!.length - 1 && ' · '}
                                    </Text>
                                  ))}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>저장된 루틴이 없습니다.</Text>
                <Text style={styles.emptySubText}>'루틴 추가' 버튼을 눌러 루틴을 만들어보세요.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 연도/월 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={datePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.datePickerModalContainer}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>연도 및 월 선택</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContent}>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>연도</Text>
                <ScrollView
                  style={styles.pickerScrollView}
                  ref={yearScrollRef}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === year && styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}년
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>월</Text>
                <ScrollView
                  style={styles.pickerScrollView}
                  ref={monthScrollRef}
                >
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedMonth === month && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMonth(month)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth === month && styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}월
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <TouchableOpacity style={styles.datePickerConfirmButton} onPress={handleDateSelect}>
              <Text style={styles.datePickerConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 운동 추가 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              if (step === 'EXERCISE') setStep('PART');
              else setModalVisible(false);
            }}>
              {step === 'EXERCISE' ? (
                <Text style={styles.backText}>뒤로</Text>
              ) : (
                <X color={Colors.text} size={24} />
              )}
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === 'PART' ? '운동 부위 선택' : `${selectedPart} 운동 선택`}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {step === 'PART' ? (
            <View style={styles.partsContainer}>
              {BODY_PARTS.map((part) => (
                <TouchableOpacity
                  key={part}
                  style={styles.partCard}
                  onPress={() => handlePartSelect(part)}
                >
                  <Dumbbell color={Colors.primary} size={32} />
                  <Text style={styles.partText}>{part}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.exercisesListContainer}>
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  // 현재 날짜의 루틴에 이미 추가된 운동인지 확인
                  const addedRecord = dailyRecords.find(record => record.exerciseId === item.id);
                  const isAdded = !!addedRecord;
                  
                  return (
                    <View
                      style={[
                        styles.exerciseItem,
                        isAdded && styles.exerciseItemAdded
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.exerciseItemTouchable}
                        onPress={() => handleExerciseSelect(item)}
                        disabled={isAdded}
                      >
                        <Text style={[
                          styles.exerciseName,
                          isAdded && styles.exerciseNameAdded
                        ]}>
                          {item.name}
                        </Text>
                        {!isAdded && (
                          <Plus color={Colors.primary} size={20} />
                        )}
                      </TouchableOpacity>
                      {isAdded && addedRecord && (
                        <TouchableOpacity
                          style={styles.quickDeleteButton}
                          onPress={async () => {
                            try {
                              await recordsApi.delete(addedRecord.id);
                              await fetchDailyRecords(selectedDate);
                            } catch (e) {
                              if (Platform.OS === 'web') {
                                alert('운동 삭제에 실패했습니다.');
                              } else {
                                Alert.alert('오류', '운동 삭제에 실패했습니다.');
                              }
                            }
                          }}
                        >
                          <X color={Colors.danger} size={20} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                ListFooterComponent={
                  <View style={styles.customAddContainer}>
                    <Text style={styles.customAddLabel}>원하는 운동이 없나요?</Text>
                    {!isAddingCustom ? (
                      <TouchableOpacity
                        style={styles.customAddButton}
                        onPress={() => setIsAddingCustom(true)}
                      >
                        <Plus color={Colors.primary} size={20} />
                        <Text style={styles.customAddButtonText}>직접 추가하기</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.customInputContainer}>
                        <TextInput
                          style={styles.customInput}
                          placeholder="운동 이름 입력"
                          value={customExerciseName}
                          onChangeText={setCustomExerciseName}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.customSaveButton}
                          onPress={handleAddCustomExercise}
                        >
                          <Text style={styles.customSaveText}>추가</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                }
              />
              
              {/* 완료 버튼 */}
              <View style={styles.exerciseModalFooter}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.doneButtonText}>완료</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* 세트 입력 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={setsModalVisible}
        onRequestClose={() => {
          setSetsModalVisible(false);
          if (editingRoutineExercise) {
            setEditingRoutineExercise(null);
            setRoutineModalVisible(true);
            // 스크롤 위치 복원
            setTimeout(() => {
              if (routineModalScrollRef.current) {
                routineModalScrollRef.current.scrollTo({
                  y: routineModalScrollPosition.current,
                  animated: false,
                });
              }
            }, 100);
          }
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setSetsModalVisible(false);
              if (editingRoutineExercise) {
                setEditingRoutineExercise(null);
                setRoutineModalVisible(true);
                // 스크롤 위치 복원
                setTimeout(() => {
                  if (routineModalScrollRef.current) {
                    routineModalScrollRef.current.scrollTo({
                      y: routineModalScrollPosition.current,
                      animated: false,
                    });
                  }
                }, 100);
              }
            }}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedRecord?.exercise?.name || editingRoutineExercise?.exerciseName || '세트 입력'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.setModalContent}>
            {sets.map((set, index) => (
              <View key={index} style={styles.setRow}>
                <View style={styles.setNumberContainer}>
                  <Text style={styles.setNumberText}>{index + 1}세트</Text>
                </View>
                <View style={styles.setInputs}>
                  <View style={styles.setInputGroup}>
                    <Text style={styles.setInputLabel}>무게 (kg)</Text>
                    <TextInput
                      style={styles.setInput}
                      value={set.weight}
                      onChangeText={(text) => {
                        const newSets = [...sets];
                        newSets[index].weight = text;
                        setSets(newSets);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.setInputGroup}>
                    <Text style={styles.setInputLabel}>횟수</Text>
                    <TextInput
                      style={styles.setInput}
                      value={set.reps}
                      onChangeText={(text) => {
                        const newSets = [...sets];
                        newSets[index].reps = text;
                        setSets(newSets);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  {index < sets.length - 1 && (
                    <View style={styles.setInputGroup}>
                      <Text style={styles.setInputLabel}>휴식 (초)</Text>
                      <TextInput
                        style={styles.setInput}
                        value={set.restTime || ''}
                        onChangeText={(text) => {
                          const newSets = [...sets];
                          newSets[index].restTime = text;
                          setSets(newSets);
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteSetButton}
                  onPress={() => {
                    const newSets = sets.filter((_, i) => i !== index);
                    setSets(newSets);
                  }}
                >
                  <Trash2 color={Colors.danger} size={20} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => setSets([...sets, { weight: '', reps: '', restTime: '' }])}
            >
              <Plus color={Colors.primary} size={20} />
              <Text style={styles.addSetButtonText}>세트 추가</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.setModalFooter}>
            <TouchableOpacity
              style={styles.saveSetsButton}
              onPress={handleSaveSets}
            >
              <Text style={styles.saveSetsButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 루틴 불러오기 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={loadRoutineModalVisible}
        onRequestClose={() => setLoadRoutineModalVisible(false)}
      >
        <View style={styles.loadRoutineModalOverlay}>
          <View style={styles.loadRoutineModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>루틴 선택</Text>
              <TouchableOpacity onPress={() => setLoadRoutineModalVisible(false)}>
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
                      style={styles.loadRoutineItem}
                      onPress={() => handleLoadRoutine(item)}
                    >
                      <View style={styles.loadRoutineItemIcon}>
                        <ListOrdered color={Colors.primary} size={20} />
                      </View>
                      <View style={styles.loadRoutineItemContent}>
                        <Text style={styles.loadRoutineItemName}>
                          {item.name}
                        </Text>
                        <Text style={styles.loadRoutineItemDetail}>
                          {categoryText} • {item.exercises.length}개 운동
                        </Text>
                      </View>
                      <ChevronRight color={Colors.textSecondary} size={20} />
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => <View style={styles.loadRoutineItemDivider} />}
              />
            ) : (
              <View style={styles.loadRoutineEmptyContainer}>
                <Text style={styles.loadRoutineEmptyText}>
                  저장된 루틴이 없습니다.
                </Text>
                <Text style={styles.loadRoutineEmptySubText}>
                  루틴 관리 탭에서 루틴을 추가해주세요.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 루틴 생성/수정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={routineModalVisible}
        onRequestClose={() => setRoutineModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              if (step === 'EXERCISE') {
                setStep('PART');
              } else {
                setRoutineModalVisible(false);
              }
            }}>
              {step === 'EXERCISE' ? (
                <Text style={styles.backText}>뒤로</Text>
              ) : (
                <X color={Colors.text} size={24} />
              )}
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === 'PART' 
                ? (editingRoutine ? '루틴 수정' : '운동 부위 선택')
                : `${selectedPart} 운동 선택`}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* 루틴 이름 입력 (상단 고정) */}
          <View style={styles.routineNameFixedContainer}>
            <TextInput
              style={styles.routineNameInput}
              placeholder="루틴 이름 (예: 상체 운동, 하체 운동)"
              value={routineName}
              onChangeText={setRoutineName}
            />
            {selectedExercisesForRoutine.length > 0 && (
              <View style={styles.selectedCountBadge}>
                <Text style={styles.selectedCountText}>
                  {selectedExercisesForRoutine.length}개 선택됨
                </Text>
              </View>
            )}
          </View>

          {step === 'PART' ? (
            <>
              <ScrollView 
                ref={routineModalScrollRef}
                style={styles.routineModalScrollView}
                contentContainerStyle={styles.routineModalScrollContent}
                onScroll={(event) => {
                  routineModalScrollPosition.current = event.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.partsContainer}>
                  {BODY_PARTS.map((part) => (
                    <TouchableOpacity
                      key={part}
                      style={styles.partCard}
                      onPress={() => {
                        setSelectedPart(part);
                        setStep('EXERCISE');
                      }}
                    >
                      <Dumbbell color={Colors.primary} size={32} />
                      <Text style={styles.partText}>{part}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 선택된 운동 목록 (드래그 가능) */}
                {selectedExercisesForRoutine.length > 0 && (
                  <View style={styles.selectedExercisesSection}>
                    <Text style={styles.selectedExercisesTitle}>선택된 운동 ({selectedExercisesForRoutine.length}개)</Text>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <DraggableFlatList
                        data={selectedExercisesForRoutine}
                        keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
                        onDragEnd={({ data }) => setSelectedExercisesForRoutine(data)}
                        scrollEnabled={false}
                        renderItem={({ item, drag, isActive, getIndex }) => {
                          const index = getIndex();
                          return (
                            <ScaleDecorator>
                              <View style={[
                                styles.selectedExerciseItem,
                                isActive && styles.selectedExerciseItemActive
                              ]}>
                                <TouchableOpacity 
                                  onLongPress={Platform.OS !== 'web' ? drag : undefined}
                                  onPressIn={Platform.OS === 'web' ? drag : undefined}
                                  disabled={isActive}
                                  style={styles.dragHandle}
                                >
                                  <GripVertical color={Colors.textSecondary} size={16} />
                                </TouchableOpacity>
                                <View style={styles.selectedExerciseNumber}>
                                  <Text style={styles.selectedExerciseNumberText}>{(index ?? 0) + 1}</Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.selectedExerciseContent}
                                  onPress={() => {
                                    if (!isActive) {
                                      openRoutineExerciseSetModal(item);
                                    }
                                  }}
                                >
                                  <Text style={styles.selectedExerciseName}>{item.exerciseName}</Text>
                                  <Text style={styles.selectedExerciseCategory}>{item.category}</Text>
                                  {item.sets && item.sets.length > 0 && (
                                    <Text style={styles.selectedExerciseSets}>
                                      {item.sets.length}세트 • {item.sets.map(s => `${s.weight}kg × ${s.reps}회`).join(' · ')}
                                    </Text>
                                  )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    if (!isActive) {
                                      setSelectedExercisesForRoutine(prev => 
                                        prev.filter(e => e.exerciseId !== item.exerciseId)
                                      );
                                    }
                                  }}
                                  style={styles.removeExerciseButton}
                                >
                                  <X color={Colors.danger} size={18} />
                                </TouchableOpacity>
                              </View>
                            </ScaleDecorator>
                          );
                        }}
                      />
                    </GestureHandlerRootView>
                  </View>
                )}
              </ScrollView>
              
              {/* 하단 저장 버튼 (고정) */}
              {selectedExercisesForRoutine.length > 0 && (
                <View style={styles.routineBottomActionsFixed}>
                  <TouchableOpacity
                    style={styles.saveRoutineButtonFixed}
                    onPress={handleSaveRoutine}
                  >
                    <Text style={styles.saveRoutineButtonText}>
                      {editingRoutine ? '루틴 수정' : '루틴 저장'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.exercisesListContainer}>
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedExercisesForRoutine.some(e => e.exerciseId === item.id);
                  
                  return (
                    <View
                      style={[
                        styles.exerciseItem,
                        isSelected && styles.exerciseItemSelected
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.exerciseItemTouchable}
                        onPress={() => handleRoutineExerciseSelect(item)}
                      >
                        <Text style={[
                          styles.exerciseName,
                          isSelected && styles.exerciseNameSelected
                        ]}>
                          {item.name}
                        </Text>
                        {isSelected ? (
                          <Check color={Colors.primary} size={20} />
                        ) : (
                          <Plus color={Colors.primary} size={20} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }}
                ListFooterComponent={
                  <View style={styles.customAddContainer}>
                    <Text style={styles.customAddLabel}>원하는 운동이 없나요?</Text>
                    {!isAddingCustom ? (
                      <TouchableOpacity
                        style={styles.customAddButton}
                        onPress={() => setIsAddingCustom(true)}
                      >
                        <Plus color={Colors.primary} size={20} />
                        <Text style={styles.customAddButtonText}>직접 추가하기</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.customInputContainer}>
                        <TextInput
                          style={styles.customInput}
                          placeholder="운동 이름 입력"
                          value={customExerciseName}
                          onChangeText={setCustomExerciseName}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.customSaveButton}
                          onPress={handleAddCustomExercise}
                        >
                          <Text style={styles.customSaveText}>추가</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                }
              />

              <View style={styles.exerciseModalFooter}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => {
                    setStep('PART');
                    setSelectedPart('');
                  }}
                >
                  <Text style={styles.doneButtonText}>다른 부위 추가</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  calendar: {
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: Colors.card,
    padding: 16,
    paddingTop: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 19.5,
    width: '100%',
    minHeight: 56,
  },
  headerDateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 40,
  },
  headerDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: 24,
  },
  headerArrowLeft: {
    padding: 0,
    paddingRight: 50,
    minWidth: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerArrowRight: {
    padding: 0,
    paddingLeft: 50,
    minWidth: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  routinesContainer: {
    flex: 1,
  },
  routinesHeaderContainer: {
    marginBottom: 10,
    gap: 12,
  },
  routinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadRoutineButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loadRoutineButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  selectionModeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  selectionModeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  selectAllButton: {
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectAllButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  selectAllButtonTextActive: {
    color: Colors.primary,
  },
  deleteSelectedButton: {
    backgroundColor: Colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  deleteSelectedButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  deleteSelectedButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelSelectionButton: {
    backgroundColor: Colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  cancelSelectionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.card,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  recordList: {
    gap: 20,
  },
  categorySection: {
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  categoryDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 8,
  },
  recordCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 12,
  },
  recordCardActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandle: {
    padding: 0,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordItemContainer: {
    flex: 1,
  },
  recordNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  recordCategoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteRecordButton: {
    padding: 8,
  },
  recordNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6', // 연한 회색 배경
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  recordContent: {
    flex: 1,
    gap: 4,
  },
  recordName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  recordCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Date Picker Modal Styles
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerModal: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  datePickerContent: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  pickerSection: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: Colors.card,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  datePickerConfirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  datePickerConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  partsContainer: {
    padding: 20,
    paddingBottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  partCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  partText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  exercisesListContainer: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exerciseItemAdded: {
    backgroundColor: '#F3F4F6',
  },
  exerciseItemTouchable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  exerciseName: {
    fontSize: 16,
    color: Colors.text,
  },
  exerciseNameAdded: {
    color: Colors.textSecondary,
  },
  addedBadge: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  quickDeleteButton: {
    padding: 16,
    paddingRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  customAddContainer: {
    padding: 24,
    alignItems: 'center',
  },
  customAddLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  customAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  customAddButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  customInputContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: Colors.card,
    fontSize: 16,
  },
  customSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  customSaveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // 세트 입력 모달 스타일
  setModalContent: {
    flex: 1,
    padding: 20,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  setNumberContainer: {
    width: 60,
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  setInputGroup: {
    flex: 1,
  },
  setInputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  setInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  deleteSetButton: {
    padding: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    marginTop: 8,
    gap: 8,
  },
  addSetButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  setModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveSetsButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveSetsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // 탭 컨트롤 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // 루틴 관리 스타일
  routinesManagement: {
    flex: 1,
  },
  routinesHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  routinesList: {
    gap: 12,
  },
  routineTemplateCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  routineTemplateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineTemplateTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routineTemplateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  routineTemplateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editRoutineButton: {
    padding: 8,
  },
  deleteRoutineButton: {
    padding: 8,
  },
  routineTemplateCategory: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  routineTemplateExercises: {
    gap: 6,
  },
  routineTemplateExerciseItem: {
    gap: 4,
    marginBottom: 4,
  },
  routineTemplateExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineTemplateExerciseNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    width: 20,
  },
  routineTemplateExerciseName: {
    fontSize: 14,
    color: Colors.text,
  },
  routineTemplateSetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 28,
    marginTop: 2,
  },
  routineTemplateSetText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // 루틴 생성 모달 스타일
  routineNameFixedContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routineNameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: Colors.card,
  },
  selectedCountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  selectedCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  routineBottomActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  routineBottomActionsFixed: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  viewSelectedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  viewSelectedButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveRoutineButtonFixed: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveRoutineButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  exerciseItemSelected: {
    backgroundColor: 'rgba(107, 70, 193, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  exerciseNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // 루틴 불러오기 모달 스타일
  loadRoutineModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  loadRoutineModalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  loadRoutineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  loadRoutineItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadRoutineItemContent: {
    flex: 1,
    gap: 4,
  },
  loadRoutineItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  loadRoutineItemDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadRoutineItemDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  loadRoutineEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadRoutineEmptyText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  loadRoutineEmptySubText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // 루틴 모달 스크롤 스타일
  routineModalScrollView: {
    flex: 1,
  },
  routineModalScrollContent: {
    paddingBottom: 20,
  },
  // 선택된 운동 목록 스타일
  selectedExercisesSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  selectedExercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  selectedExerciseItemActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedExerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedExerciseNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectedExerciseContent: {
    flex: 1,
    gap: 2,
  },
  selectedExerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedExerciseCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  selectedExerciseSets: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  removeExerciseButton: {
    padding: 4,
  },
  setsScrollView: {
    maxHeight: 400,
  },
  setInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  setNumberLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    width: 50,
    paddingTop: 12,
  },
  setInputsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  removeSetButton: {
    padding: 8,
    justifyContent: 'center',
  },
  setsModalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
