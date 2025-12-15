import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateRecordSetDto {
  @IsString()
  recordId: string;

  @IsNumber()
  setNumber: number;

  @IsNumber()
  weight: number;

  @IsNumber()
  reps: number;

  @IsOptional()
  @IsNumber()
  rpe?: number;

  @IsOptional()
  @IsNumber()
  restTime?: number;
}

