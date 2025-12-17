export interface InbodyStatsDto {
  period: string; // 'week' | 'month' | 'year'
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








