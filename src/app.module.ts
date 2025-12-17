import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PRsModule } from './prs/prs.module';
import { InbodyModule } from './inbody/inbody.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RecordsModule } from './records/records.module';
import { WorkoutDaysModule } from './workout-days/workout-days.module';
import { RoutinesModule } from './routines/routines.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    PRsModule,
    InbodyModule,
    ExercisesModule,
    RecordsModule,
    WorkoutDaysModule,
    RoutinesModule,
  ],
})
export class AppModule {}
