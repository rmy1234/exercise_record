import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseDto {
  @IsString()
  exerciseId: string;

  @IsString()
  exerciseName: string;

  @IsString()
  category: string;
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

