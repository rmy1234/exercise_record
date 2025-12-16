import { IsString, IsDateString } from 'class-validator';

export class CreateRecordDto {
  @IsString()
  userId: string;

  @IsString()
  exerciseId: string;

  @IsDateString()
  date: string;
}



