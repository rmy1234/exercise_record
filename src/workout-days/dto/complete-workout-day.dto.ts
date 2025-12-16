import { IsString } from 'class-validator';

export class CompleteWorkoutDayDto {
  @IsString()
  userId: string;

  // YYYY-MM-DD
  @IsString()
  date: string;
}





