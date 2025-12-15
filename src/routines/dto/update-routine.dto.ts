import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  exercises?: any[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


