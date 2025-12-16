import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreateRecordSetDto {
  @IsString()
  recordId: string;

  @IsInt()
  setNumber: number;

  @IsNumber()
  weight: number;

  @IsInt()
  reps: number;

  @IsOptional()
  @IsNumber()
  rpe?: number;

  @IsOptional()
  @IsInt()
  restTime?: number;
}