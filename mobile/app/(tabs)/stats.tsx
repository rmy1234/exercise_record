import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { LineChart } from 'react-native-chart-kit';
import { Plus, X, ChevronDown, Activity, BarChart } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { recordsApi, exercisesApi, inbodyApi } from '../../services/api';
import { Record, Exercise, Inbody } from '../../types';

const screenWidth = Dimensions.get('window').width;
const BODY_PARTS = ['가슴', '등', '하체', '어깨', '팔'];
const CHART_HEIGHT = 260;
const CHART_SEGMENTS = 5;
const CHART_PADDING_VERTICAL = 34; // 상하 여백 확보
const Y_AXIS_LABEL_OFFSET = 19; // 라벨을 그리드선에 맞춰 정렬

interface StatsData {
  date: string; // 표시용 (MM/DD)
  fullDate: Date; // 필터링/정렬용
  weight: number;
  muscle: number;
  fat: number;
}

// Inbody 데이터를 StatsData 형식으로 변환
const convertInbodyToStatsData = (inbody: Inbody): StatsData => {
  const fullDate = new Date(inbody.date);
  const month = String(fullDate.getMonth() + 1).padStart(2, '0');
  const day = String(fullDate.getDate()).padStart(2, '0');
  return {
    date: `${month}/${day}`,
    fullDate: fullDate,
    weight: inbody.weight,
    muscle: inbody.skeletalMuscle,
    fat: inbody.bodyFatPercent || 0,
  };
};

interface ExerciseRecordData {
  date: string; // 표시용 (MM/DD)
  fullDate: Date; // 필터링/정렬용
  weight: number; // 최고 기록 (weight × reps의 최대값)
  sets: Array<{ weight: number; reps: number; setNumber: number }>;
}

export default function StatsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'body' | 'exercise'>('body');
  
  // 몸 변화 관련 상태
  const [bodyData, setBodyData] = useState<StatsData[]>([]);
  const [isLoadingBodyData, setIsLoadingBodyData] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    weight: true,
    muscle: false,
    fat: false,
  });
  const [bodyFilter, setBodyFilter] = useState<'week' | 'month' | 'year'>('month');
  const [bodyModalVisible, setBodyModalVisible] = useState(false);
  const [inputDate, setInputDate] = useState('');
  const [inputWeight, setInputWeight] = useState('');
  const [inputMuscle, setInputMuscle] = useState('');
  const [inputFat, setInputFat] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: 0 });
  const [bodyDetailModalVisible, setBodyDetailModalVisible] = useState(false);
  const [selectedBodyData, setSelectedBodyData] = useState<StatsData | null>(null);

  // 운동 변화 관련 상태
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseRecords, setExerciseRecords] = useState<ExerciseRecordData[]>([]);
  const [exerciseFilter, setExerciseFilter] = useState<'week' | 'month' | 'year'>('month');
  const [exerciseDetailModalVisible, setExerciseDetailModalVisible] = useState(false);
  const [selectedDateRecord, setSelectedDateRecord] = useState<ExerciseRecordData | null>(null);
  const [selectedPart, setSelectedPart] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [exerciseDropdownOpen, setExerciseDropdownOpen] = useState(false);

  const fetchBodyData = useCallback(async () => {
    if (!user) return;
    setIsLoadingBodyData(true);
    try {
      const inbodyList = await inbodyApi.getAll(user.id);
      const statsData = inbodyList
        .map(convertInbodyToStatsData)
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
      setBodyData(statsData);
    } catch (e) {
      console.error('Failed to fetch body data', e);
      setBodyData([]);
    } finally {
      setIsLoadingBodyData(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'body' && user) {
      fetchBodyData();
    } else if (activeTab === 'exercise') {
      fetchExercises();
    }
  }, [activeTab, user, fetchBodyData]);

  useEffect(() => {
    if (selectedExercise && user) {
      fetchExerciseRecords();
    }
  }, [selectedExercise, user]);

  const fetchExercises = async () => {
    try {
      const data = await exercisesApi.getAll();
      // 기록이 있는 운동만 필터링
      if (user) {
        const exercisesWithRecords: Exercise[] = [];
        for (const exercise of data) {
          const records = await recordsApi.getByExercise(user.id, exercise.id);
          if (records.length > 0) {
            exercisesWithRecords.push(exercise);
          }
        }
        // 가나다순으로 정렬
        const sortedExercises = exercisesWithRecords.sort((a, b) => 
          (a.name || '').localeCompare(b.name || '', 'ko')
        );
        setExercises(sortedExercises);
      }
    } catch (e) {
      console.error('Failed to fetch exercises', e);
    }
  };

  const filteredExercises = selectedPart 
    ? exercises
        .filter(ex => ex.category === selectedPart)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'))
    : [];
  
  const handleCategorySelect = (category: string) => {
    setSelectedPart(category);
    setSelectedExercise(null); // 카테고리 변경 시 운동 초기화
    setCategoryDropdownOpen(false);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseDropdownOpen(false);
  };

  const fetchExerciseRecords = async () => {
    if (!selectedExercise || !user) return;
    try {
      const records = await recordsApi.getByExercise(user.id, selectedExercise.id);
      
      // 날짜별로 그룹화하고 최고 기록 계산
      const dateMap = new Map<string, ExerciseRecordData>();
      
      records.forEach(record => {
        const fullDate = new Date(record.date);
        const month = String(fullDate.getMonth() + 1).padStart(2, '0');
        const day = String(fullDate.getDate()).padStart(2, '0');
        const dateStr = `${month}/${day}`;
        const dateKey = fullDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 고유 키
        
        if (!record.sets || record.sets.length === 0) return;
        
        const sets = record.sets.map(set => ({
          weight: set.weight,
          reps: set.reps,
          setNumber: set.setNumber,
        }));
        
        // 최고 기록 계산: 가장 높은 무게(weight)를 가진 세트 선택
        // 무게가 같으면 reps가 높은 것을 선택
        const bestSet = record.sets.reduce((best, current) => {
          // 무게가 더 높은 것이 최고 기록
          if (current.weight > best.weight) {
            return current;
          }
          // 무게가 같으면 reps가 더 높은 것을 선택
          if (current.weight === best.weight && current.reps > best.reps) {
            return current;
          }
          return best;
        });
        
        dateMap.set(dateKey, {
          date: dateStr,
          fullDate: fullDate,
          weight: bestSet.weight, // 최고 무게
          sets,
        });
      });
      
      const sortedRecords = Array.from(dateMap.values()).sort((a, b) => {
        return a.fullDate.getTime() - b.fullDate.getTime();
      });
      
      setExerciseRecords(sortedRecords);
    } catch (e) {
      console.error('Failed to fetch exercise records', e);
    }
  };

  const toggleMetric = (metric: 'weight' | 'muscle' | 'fat') => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const handleAddData = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    
    setInputDate(formattedDate);
    setInputWeight('');
    setInputMuscle('');
    setInputFat('');
    setBodyModalVisible(true);
  };

  const handleSave = async () => {
    if (!inputDate || !inputWeight || !inputMuscle || !inputFat || !user) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }

    try {
      // YYYY/MM/DD 형식을 YYYY-MM-DD로 변환
      const [year, month, day] = inputDate.split('/').map(Number);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      await inbodyApi.create({
        userId: user.id,
        date: dateStr,
        weight: parseFloat(inputWeight),
        skeletalMuscle: parseFloat(inputMuscle),
        bodyFatPercent: parseFloat(inputFat),
      });

      // 데이터 다시 불러오기
      await fetchBodyData();
      setBodyModalVisible(false);
    } catch (e) {
      console.error('Failed to save body data', e);
      Alert.alert('오류', '데이터 저장에 실패했습니다.');
    }
  };

  // 필터링된 몸 변화 데이터
  const getFilteredBodyData = (): StatsData[] => {
    if (bodyData.length === 0) return [];
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (bodyFilter) {
      case 'week':
        // 이번 주 월요일 계산 (월요일~일요일 기준)
        const dayOfWeek = now.getDay(); // 0(일요일) ~ 6(토요일)
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 일요일이면 6일 전, 아니면 dayOfWeek - 1
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - daysFromMonday);
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate = new Date(now);
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    const filtered = bodyData.filter(item => {
      return item.fullDate >= cutoffDate;
    });
    
    // 날짜순으로 정렬
    return filtered.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  };

  const filteredBodyData = getFilteredBodyData();

  // 그래프 width 계산 (한 화면에 최대 5개, 데이터가 더 많으면 스크롤)
  const calculateChartWidth = (dataLength: number): number => {
    const baseWidth = screenWidth - 80; // Y축 라벨 공간 제외
    const itemWidth = baseWidth / 5; // 5개 기준으로 한 아이템당 width
    const minWidth = baseWidth; // 최소 width
    return Math.max(minWidth, itemWidth * dataLength);
  };

  // Y축 값 계산 (데이터에서 최소/최대값 추출)
  const getYAxisValues = (data: number[]): string[] => {
    if (data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const step = range / CHART_SEGMENTS;
    const values: string[] = [];
    for (let i = CHART_SEGMENTS; i >= 0; i--) {
      const value = min + (step * i);
      values.push(value.toFixed(1));
    }
    return values;
  };

  const renderYAxisLabels = (values: string[]) => {
    const drawableHeight = CHART_HEIGHT - CHART_PADDING_VERTICAL * 2;
    const interval = drawableHeight / CHART_SEGMENTS;
    return values.map((value, index) => (
      <Text 
        key={`${value}-${index}`} 
        style={[styles.yAxisLabel, { top: CHART_PADDING_VERTICAL + interval * index }]}
      >
        {value}
      </Text>
    ));
  };

  // 필터링된 운동 변화 데이터
  const getFilteredExerciseRecords = (): ExerciseRecordData[] => {
    if (exerciseRecords.length === 0) return [];
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (exerciseFilter) {
      case 'week':
        // 이번 주 월요일 계산 (월요일~일요일 기준)
        const dayOfWeek = now.getDay(); // 0(일요일) ~ 6(토요일)
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 일요일이면 6일 전, 아니면 dayOfWeek - 1
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - daysFromMonday);
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate = new Date(now);
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return exerciseRecords.filter(item => {
      return item.fullDate >= cutoffDate;
    });
  };

  const filteredExerciseRecords = getFilteredExerciseRecords();

  const handleBodyDataPointClick = (dataPoint: { x: number; y: number; value: number; index: number }) => {
    if (filteredBodyData[dataPoint.index]) {
      setSelectedBodyData(filteredBodyData[dataPoint.index]);
      setBodyDetailModalVisible(true);
    }
  };

  const handleExerciseDataPointClick = (dataPoint: { x: number; y: number; value: number; index: number }) => {
    if (filteredExerciseRecords[dataPoint.index]) {
      setSelectedDateRecord(filteredExerciseRecords[dataPoint.index]);
      setExerciseDetailModalVisible(true);
    }
  };

  const bodyChartData = {
    labels: filteredBodyData.map((d: StatsData) => d.date),
    datasets: [
      selectedMetrics.weight && {
        data: filteredBodyData.map((d: StatsData) => d.weight),
        color: (opacity = 1) => Colors.chart.weight,
        strokeWidth: 2,
        withDots: true,
      },
      selectedMetrics.muscle && {
        data: filteredBodyData.map((d: StatsData) => d.muscle),
        color: (opacity = 1) => Colors.chart.muscle,
        strokeWidth: 2,
        withDots: true,
      },
      selectedMetrics.fat && {
        data: filteredBodyData.map((d: StatsData) => d.fat),
        color: (opacity = 1) => Colors.chart.fat,
        strokeWidth: 2,
        withDots: true,
      },
    ].filter(Boolean) as any[],
  };

  const exerciseChartData = filteredExerciseRecords.length > 0 ? {
    labels: filteredExerciseRecords.map(r => r.date),
    datasets: [{
      data: filteredExerciseRecords.map(r => r.weight),
      color: (opacity = 1) => Colors.primary,
      strokeWidth: 2,
      withDots: true,
    }],
  } : null;

  const isNoBodyData = bodyChartData.datasets.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>통계</Text>
        
        {/* 탭 컨트롤 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'body' && styles.tabActive]}
            onPress={() => setActiveTab('body')}
          >
            <Activity color={activeTab === 'body' ? Colors.primary : Colors.textSecondary} size={20} />
            <Text style={[styles.tabText, activeTab === 'body' && styles.tabTextActive]}>
              몸 변화
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'exercise' && styles.tabActive]}
            onPress={() => setActiveTab('exercise')}
          >
            <BarChart color={activeTab === 'exercise' ? Colors.primary : Colors.textSecondary} size={20} />
            <Text style={[styles.tabText, activeTab === 'exercise' && styles.tabTextActive]}>
              운동 변화
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'body' ? (
          <>
            <View style={styles.filterContainer}>
              <View style={styles.filterButtonsRow}>
                <FilterButton 
                  label="체중" 
                  color={Colors.chart.weight} 
                  active={selectedMetrics.weight} 
                  onPress={() => toggleMetric('weight')} 
                />
                <FilterButton 
                  label="골격근량" 
                  color={Colors.chart.muscle} 
                  active={selectedMetrics.muscle} 
                  onPress={() => toggleMetric('muscle')} 
                />
                <FilterButton 
                  label="체지방률" 
                  color={Colors.chart.fat} 
                  active={selectedMetrics.fat} 
                  onPress={() => toggleMetric('fat')} 
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={handleAddData}>
                <Plus color="#fff" size={20} />
                <Text style={styles.addButtonText}>기록</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              {!isNoBodyData ? (
                <>
                  <View style={styles.chartHeader}>
                    <View style={styles.periodFilterContainer}>
                      <TouchableOpacity
                        style={[styles.periodFilterButton, bodyFilter === 'week' && styles.periodFilterButtonActive]}
                        onPress={() => setBodyFilter('week')}
                      >
                        <Text style={[styles.periodFilterText, bodyFilter === 'week' && styles.periodFilterTextActive]}>
                          주
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.periodFilterButton, bodyFilter === 'month' && styles.periodFilterButtonActive]}
                        onPress={() => setBodyFilter('month')}
                      >
                        <Text style={[styles.periodFilterText, bodyFilter === 'month' && styles.periodFilterTextActive]}>
                          월
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.periodFilterButton, bodyFilter === 'year' && styles.periodFilterButtonActive]}
                        onPress={() => setBodyFilter('year')}
                      >
                        <Text style={[styles.periodFilterText, bodyFilter === 'year' && styles.periodFilterTextActive]}>
                          연
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.chartWithYAxis}>
                    {/* Y축 라벨 (고정) */}
                    <View style={styles.yAxisContainer}>
                      {(() => {
                        // 활성화된 메트릭의 모든 데이터 수집
                        const allValues: number[] = [];
                        if (selectedMetrics.weight) {
                          allValues.push(...filteredBodyData.map(d => d.weight));
                        }
                        if (selectedMetrics.muscle) {
                          allValues.push(...filteredBodyData.map(d => d.muscle));
                        }
                        if (selectedMetrics.fat) {
                          allValues.push(...filteredBodyData.map(d => d.fat));
                        }
                        if (allValues.length === 0) return null;
                        const min = Math.min(...allValues);
                        const max = Math.max(...allValues);
                        const yValues = getYAxisValues(allValues);
                        return renderYAxisLabels(yValues);
                      })()}
                    </View>
                    {/* 그래프 영역 (스크롤 가능) */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.chartScrollView}
                      contentContainerStyle={styles.chartScrollContent}
                    >
                      <View style={styles.chartWrapper}>
                        <LineChart
                          data={bodyChartData}
                          width={calculateChartWidth(filteredBodyData.length)}
                          height={CHART_HEIGHT}
                          yAxisLabel=""
                          yAxisSuffix=""
                          yLabelsOffset={-1000}
                          xLabelsOffset={-5}
                          onDataPointClick={handleBodyDataPointClick}
                          chartConfig={{
                            backgroundColor: Colors.card,
                            backgroundGradientFrom: Colors.card,
                            backgroundGradientTo: Colors.card,
                            decimalPlaces: 1,
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, 0.7)`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: '6', strokeWidth: '2' },
                            propsForLabels: { fontSize: 13, dy: 18 }, // x축 라벨을 아래로 조금 내려서 여백 확보
                            propsForBackgroundLines: {
                              strokeDasharray: '',
                              stroke: Colors.border,
                              strokeOpacity: 0.3,
                            },
                            strokeWidth: 2,
                          }}
                          style={styles.chart}
                          withDots={true}
                          withInnerLines={true}
                          withOuterLines={false}
                          withVerticalLines={false}
                          withHorizontalLines={true}
                          withShadow={false}
                          fromZero={false}
                          segments={CHART_SEGMENTS}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>표시할 데이터 종류를 선택해주세요</Text>
                </View>
              )}
            </View>

            {bodyData.length > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>최신 기록 요약</Text>
                <View style={styles.summaryCard}>
                  <SummaryItem 
                    label="체중" 
                    value={`${bodyData[bodyData.length-1].weight} kg`} 
                    color={Colors.chart.weight} 
                  />
                  <View style={styles.divider} />
                  <SummaryItem 
                    label="골격근량" 
                    value={`${bodyData[bodyData.length-1].muscle} kg`} 
                    color={Colors.chart.muscle} 
                  />
                  <View style={styles.divider} />
                  <SummaryItem 
                    label="체지방률" 
                    value={`${bodyData[bodyData.length-1].fat} %`} 
                    color={Colors.chart.fat} 
                  />
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* 운동 선택 - 드롭다운 두 개 */}
            <View style={styles.dropdownContainer}>
              {/* 카테고리 드롭다운 */}
              <View style={[styles.dropdownWrapper, styles.categoryDropdownWrapper]}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setCategoryDropdownOpen(!categoryDropdownOpen);
                    setExerciseDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedPart || '카테고리'}
                  </Text>
                  <ChevronDown color={Colors.textSecondary} size={20} />
                </TouchableOpacity>
                {categoryDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScrollView}>
                      {BODY_PARTS.map((part) => (
                        <TouchableOpacity
                          key={part}
                          style={[
                            styles.dropdownItem,
                            selectedPart === part && styles.dropdownItemSelected,
                          ]}
                          onPress={() => handleCategorySelect(part)}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedPart === part && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {part}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 운동명 드롭다운 */}
              <View style={[styles.dropdownWrapper, styles.exerciseDropdownWrapper]}>
                <TouchableOpacity
                  style={[styles.dropdownButton, !selectedPart && styles.dropdownButtonDisabled]}
                  onPress={() => {
                    if (selectedPart) {
                      setExerciseDropdownOpen(!exerciseDropdownOpen);
                      setCategoryDropdownOpen(false);
                    }
                  }}
                  disabled={!selectedPart}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !selectedPart && styles.dropdownButtonTextDisabled,
                  ]}>
                    {selectedExercise ? selectedExercise.name : '운동 선택'}
                  </Text>
                  <ChevronDown color={selectedPart ? Colors.textSecondary : Colors.border} size={20} />
                </TouchableOpacity>
                {exerciseDropdownOpen && selectedPart && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScrollView}>
                      {filteredExercises.length > 0 ? (
                        filteredExercises.map((exercise) => (
                          <TouchableOpacity
                            key={exercise.id}
                            style={[
                              styles.dropdownItem,
                              selectedExercise?.id === exercise.id && styles.dropdownItemSelected,
                            ]}
                            onPress={() => handleExerciseSelect(exercise)}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selectedExercise?.id === exercise.id && styles.dropdownItemTextSelected,
                              ]}
                            >
                              {exercise.name}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.dropdownItem}>
                          <Text style={[styles.dropdownItemText, { color: Colors.textSecondary }]}>
                            기록이 없습니다
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.chartContainer}>
              {exerciseChartData ? (
                <>
                  <View style={styles.chartHeader}>
                    <View style={styles.periodFilterContainer}>
                      <TouchableOpacity
                        style={[styles.periodFilterButton, exerciseFilter === 'week' && styles.periodFilterButtonActive]}
                        onPress={() => setExerciseFilter('week')}
                      >
                        <Text style={[styles.periodFilterText, exerciseFilter === 'week' && styles.periodFilterTextActive]}>
                          주
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.periodFilterButton, exerciseFilter === 'month' && styles.periodFilterButtonActive]}
                        onPress={() => setExerciseFilter('month')}
                      >
                        <Text style={[styles.periodFilterText, exerciseFilter === 'month' && styles.periodFilterTextActive]}>
                          월
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.periodFilterButton, exerciseFilter === 'year' && styles.periodFilterButtonActive]}
                        onPress={() => setExerciseFilter('year')}
                      >
                        <Text style={[styles.periodFilterText, exerciseFilter === 'year' && styles.periodFilterTextActive]}>
                          연
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.chartWithYAxis}>
                    {/* Y축 라벨 (고정) */}
                    <View style={styles.yAxisContainer}>
                      {(() => {
                        const weights = filteredExerciseRecords.map(r => r.weight);
                        if (weights.length === 0) return null;
                        const min = Math.min(...weights);
                        const max = Math.max(...weights);
                        const range = max - min || 1;
                        const step = range / CHART_SEGMENTS;
                        const yValues: string[] = [];
                        for (let i = CHART_SEGMENTS; i >= 0; i--) {
                          const value = min + (step * i);
                          yValues.push(value.toFixed(0));
                        }
                        return renderYAxisLabels(yValues);
                      })()}
                    </View>
                    {/* 그래프 영역 (스크롤 가능) */}
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.chartScrollView}
                      contentContainerStyle={styles.chartScrollContent}
                    >
                      <View style={styles.chartWrapper}>
                        <LineChart
                          data={exerciseChartData}
                          width={calculateChartWidth(filteredExerciseRecords.length)}
                          height={CHART_HEIGHT}
                          yAxisLabel=""
                          yAxisSuffix=""
                          yLabelsOffset={-1000}
                          xLabelsOffset={-5}
                          onDataPointClick={handleExerciseDataPointClick}
                          chartConfig={{
                            backgroundColor: Colors.card,
                            backgroundGradientFrom: Colors.card,
                            backgroundGradientTo: Colors.card,
                            decimalPlaces: 1,
                            color: (opacity = 1) => Colors.primary,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, 0.7)`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: '6', strokeWidth: '2' },
                            propsForLabels: { fontSize: 13, dy: 18 }, // x축 라벨 여백 확보
                            propsForBackgroundLines: {
                              strokeDasharray: '',
                              stroke: Colors.border,
                              strokeOpacity: 0.3,
                            },
                            strokeWidth: 2,
                          }}
                          style={styles.chart}
                          withDots={true}
                          withInnerLines={true}
                          withOuterLines={false}
                          withVerticalLines={false}
                          withHorizontalLines={true}
                          withShadow={false}
                          fromZero={false}
                          segments={CHART_SEGMENTS}
                        />
                      </View>
                    </ScrollView>
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    {!selectedPart ? '표시할 데이터 종류를 선택해주세요' : '기록이 없습니다'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* 몸 변화 입력 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bodyModalVisible}
        onRequestClose={() => setBodyModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>새 기록 추가</Text>
              <TouchableOpacity onPress={() => setBodyModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>날짜 (YYYY/MM/DD)</Text>
              <TextInput
                style={styles.input}
                value={inputDate}
                onChangeText={setInputDate}
                placeholder="2024/12/31"
                keyboardType="numbers-and-punctuation"
              />
              
              <Text style={styles.label}>체중 (kg)</Text>
              <TextInput
                style={styles.input}
                value={inputWeight}
                onChangeText={setInputWeight}
                placeholder="0.0"
                keyboardType="numeric"
              />

              <Text style={styles.label}>골격근량 (kg)</Text>
              <TextInput
                style={styles.input}
                value={inputMuscle}
                onChangeText={setInputMuscle}
                placeholder="0.0"
                keyboardType="numeric"
              />

              <Text style={styles.label}>체지방률 (%)</Text>
              <TextInput
                style={styles.input}
                value={inputFat}
                onChangeText={setInputFat}
                placeholder="0.0"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 몸 변화 상세 정보 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bodyDetailModalVisible}
        onRequestClose={() => setBodyDetailModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBodyData ? `${selectedBodyData.date} 기록` : ''}
              </Text>
              <TouchableOpacity onPress={() => setBodyDetailModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            {selectedBodyData && (
              <View style={styles.bodyDetailContainer}>
                <View style={styles.bodyDetailItem}>
                  <Text style={styles.bodyDetailLabel}>체중</Text>
                  <Text style={[styles.bodyDetailValue, { color: Colors.chart.weight }]}>
                    {selectedBodyData.weight} kg
                  </Text>
                </View>
                <View style={styles.bodyDetailItem}>
                  <Text style={styles.bodyDetailLabel}>골격근량</Text>
                  <Text style={[styles.bodyDetailValue, { color: Colors.chart.muscle }]}>
                    {selectedBodyData.muscle} kg
                  </Text>
                </View>
                <View style={styles.bodyDetailItem}>
                  <Text style={styles.bodyDetailLabel}>체지방률</Text>
                  <Text style={[styles.bodyDetailValue, { color: Colors.chart.fat }]}>
                    {selectedBodyData.fat} %
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 운동 세트 상세 정보 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={exerciseDetailModalVisible}
        onRequestClose={() => setExerciseDetailModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDateRecord ? `${selectedDateRecord.date} 기록` : ''}
              </Text>
              <TouchableOpacity onPress={() => setExerciseDetailModalVisible(false)}>
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>
            {selectedDateRecord && (
              <View style={styles.setsContainer}>
                {selectedDateRecord.sets.map((set, index) => (
                  <View key={index} style={styles.setItem}>
                    <Text style={styles.setNumber}>{set.setNumber}세트</Text>
                    <Text style={styles.setInfo}>{set.weight}kg × {set.reps}회</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const FilterButton = ({ label, color, active, onPress }: { label: string, color: string, active: boolean, onPress: () => void }) => (
  <TouchableOpacity 
    style={[
      styles.filterButton, 
      active ? { backgroundColor: color, borderColor: color } : { borderColor: color }
    ]} 
    onPress={onPress}
  >
    <Text style={[styles.filterText, active ? { color: '#fff' } : { color: color }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SummaryItem = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const numericValue = value.split(' ')[0];
  const unit = value.split(' ')[1] || '';
  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryLabelContainer, { backgroundColor: color + '1A' }]}>
        <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{numericValue}</Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  dropdownContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    zIndex: 1000,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  categoryDropdownWrapper: {
    width: '30%', // 카테고리는 좁게
  },
  exerciseDropdownWrapper: {
    flex: 1, // 운동명은 넓게
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownButtonDisabled: {
    backgroundColor: Colors.background,
    opacity: 0.6,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  dropdownButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary + '1A',
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  dropdownItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  periodFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  periodFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodFilterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  periodFilterTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 280,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartWithYAxis: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxisContainer: {
    width: 40,
    height: CHART_HEIGHT,
    position: 'relative',
    alignItems: 'center',
    paddingRight: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  yAxisLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    transform: [{ translateY: -Y_AXIS_LABEL_OFFSET }],
  },
  chartScrollView: {
    flex: 1,
  },
  chartScrollContent: {
    flexGrow: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingLeft: 0,
    paddingRight: 12,
  },
  chartWrapper: {
    marginLeft: -45,
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 7,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  summaryLabelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryUnit: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bodyDetailContainer: {
    marginTop: 10,
  },
  bodyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  bodyDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  bodyDetailValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  setsContainer: {
    marginTop: 10,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  setInfo: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
});