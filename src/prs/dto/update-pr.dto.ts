import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePRDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  squat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bench?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deadlift?: number;

  @IsOptional()
  date?: Date;
}







