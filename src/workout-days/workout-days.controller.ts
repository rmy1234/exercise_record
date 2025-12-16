import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WorkoutDaysService } from './workout-days.service';
import { CompleteWorkoutDayDto } from './dto/complete-workout-day.dto';

@Controller('workout-days')
export class WorkoutDaysController {
  constructor(private readonly workoutDaysService: WorkoutDaysService) {}

  @Post('complete')
  complete(@Body() dto: CompleteWorkoutDayDto) {
    return this.workoutDaysService.markCompleted(dto.userId, dto.date);
  }

  @Get('status')
  status(@Query('userId') userId: string, @Query('date') date: string) {
    return this.workoutDaysService.getStatus(userId, date);
  }

  @Get('completed-dates')
  completedDates(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.workoutDaysService.getCompletedDates(userId, startDate, endDate);
  }
}





