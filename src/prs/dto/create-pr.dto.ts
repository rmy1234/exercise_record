import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePRDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  squat?: number; // kg

  @IsOptional()
  @IsNumber()
  @Min(0)
  bench?: number; // kg

  @IsOptional()
  @IsNumber()
  @Min(0)
  deadlift?: number; // kg

  @IsOptional()
  date?: Date;
}





