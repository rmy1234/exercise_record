import { IsString, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class SetDto {
  @IsNumber()
  weight: number;

  @IsNumber()
  reps: number;

  @IsOptional()
  @IsNumber()
  restTime?: number;
}

class ExerciseDto {
  @IsString()
  exerciseId: string;

  @IsString()
  exerciseName: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetDto)
  sets?: SetDto[];
}

export class UpdateRoutineTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises?: ExerciseDto[];
}

