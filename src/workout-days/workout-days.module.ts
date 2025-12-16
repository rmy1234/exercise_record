import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkoutDaysController } from './workout-days.controller';
import { WorkoutDaysService } from './workout-days.service';
import { WorkoutDaysScheduler } from './workout-days.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [WorkoutDaysController],
  providers: [WorkoutDaysService, WorkoutDaysScheduler],
})
export class WorkoutDaysModule {}




