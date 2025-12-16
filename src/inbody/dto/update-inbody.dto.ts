import { IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class UpdateInbodyDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  skeletalMuscle?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bodyFat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bodyFatPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bmi?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basalMetabolic?: number;
}




