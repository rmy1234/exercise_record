import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkoutDaysService {
  constructor(private readonly prisma: PrismaService) {}

  private toStartOfDayUtc(date: string) {
    // YYYY-MM-DD -> UTC 00:00:00
    const d = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return d;
  }

  private toEndOfDayUtc(date: string) {
    const d = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return d;
  }

  async markCompleted(userId: string, date: string) {
    const day = this.toStartOfDayUtc(date);
    const endDay = this.toEndOfDayUtc(date);
    
    // 해당 날짜의 모든 레코드를 완료 상태로 설정
    await this.prisma.record.updateMany({
      where: {
        userId,
        date: {
          gte: day,
          lte: endDay,
        },
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
    
    return this.prisma.workoutDay.upsert({
      where: { userId_date: { userId, date: day } },
      update: { isCompleted: true, completedAt: new Date() },
      create: { userId, date: day, isCompleted: true, completedAt: new Date() },
    });
  }

  async getStatus(userId: string, date: string) {
    const day = this.toStartOfDayUtc(date);
    const found = await this.prisma.workoutDay.findUnique({
      where: { userId_date: { userId, date: day } },
      select: { isCompleted: true, completedAt: true },
    });
    return { completed: Boolean(found?.isCompleted), completedAt: found?.completedAt ?? null };
  }

  async getCompletedDates(userId: string, startDate: string, endDate: string) {
    const start = this.toStartOfDayUtc(startDate);
    const end = this.toEndOfDayUtc(endDate);
    const rows = await this.prisma.workoutDay.findMany({
      where: {
        userId,
        isCompleted: true,
        date: { gte: start, lte: end },
      },
      select: { date: true },
      orderBy: { date: 'asc' },
    });
    return rows.map((r) => r.date.toISOString().split('T')[0]);
  }

  /**
   * 이전 주(월요일~일요일)의 모든 workoutDays 데이터를 삭제합니다.
   * 월요일 00:00에 실행되어야 합니다.
   */
  async deletePreviousWeekData() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0(일요일) ~ 6(토요일)
    
    // 현재 날짜가 월요일(1)이 아니면 실행하지 않음
    // 하지만 스케줄러가 월요일 00:00에 실행되므로 항상 월요일일 것입니다.
    
    // 이전 주 월요일 계산 (현재가 월요일이면 지난 주 월요일)
    const previousMonday = new Date(now);
    previousMonday.setDate(now.getDate() - 7 - dayOfWeek + 1); // 지난 주 월요일
    previousMonday.setHours(0, 0, 0, 0);
    
    // 이전 주 일요일 계산
    const previousSunday = new Date(previousMonday);
    previousSunday.setDate(previousMonday.getDate() + 6); // 지난 주 일요일
    previousSunday.setHours(23, 59, 59, 999);
    
    // UTC로 변환
    const startUtc = new Date(previousMonday.toISOString());
    const endUtc = new Date(previousSunday.toISOString());
    
    // 이전 주의 모든 workoutDays 데이터 삭제
    const result = await this.prisma.workoutDay.deleteMany({
      where: {
        date: {
          gte: startUtc,
          lte: endUtc,
        },
      },
    });
    
    return {
      deletedCount: result.count,
      weekStart: startUtc.toISOString(),
      weekEnd: endUtc.toISOString(),
    };
  }
}




