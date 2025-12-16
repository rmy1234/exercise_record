import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkoutDaysService } from './workout-days.service';

@Injectable()
export class WorkoutDaysScheduler {
  constructor(private readonly workoutDaysService: WorkoutDaysService) {}

  /**
   * 매주 월요일 00:00 (UTC)에 실행되어 이전 주의 workoutDays 데이터를 삭제합니다.
   * Cron 표현식: '0 0 * * 1' = 매주 월요일 00:00
   */
  @Cron('0 0 * * 1', {
    name: 'deletePreviousWeekWorkoutDays',
    timeZone: 'UTC',
  })
  async handleDeletePreviousWeekData() {
    try {
      const result = await this.workoutDaysService.deletePreviousWeekData();
      console.log(
        `[WorkoutDaysScheduler] 이전 주 데이터 삭제 완료: ${result.deletedCount}개 삭제됨 (${result.weekStart} ~ ${result.weekEnd})`,
      );
    } catch (error) {
      console.error('[WorkoutDaysScheduler] 이전 주 데이터 삭제 실패:', error);
    }
  }
}

