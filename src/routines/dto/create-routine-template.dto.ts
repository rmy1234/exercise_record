import { IsString, IsArray, ValidateNested, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
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
  @IsNotEmpty()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  exerciseName: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetDto)
  sets?: SetDto[];
}

export class CreateRoutineTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}

