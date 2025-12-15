import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RoutinesModule } from './routines/routines.module';
import { PRsModule } from './prs/prs.module';
import { InbodyModule } from './inbody/inbody.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RecordsModule } from './records/records.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    RoutinesModule,
    PRsModule,
    InbodyModule,
    ExercisesModule,
    RecordsModule,
  ],
})
export class AppModule {}
