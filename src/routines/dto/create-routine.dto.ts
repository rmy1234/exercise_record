import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoutineDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  exercises: any[]; // 운동 목록 JSON 배열

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


