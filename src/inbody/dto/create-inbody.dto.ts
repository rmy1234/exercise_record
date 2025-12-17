import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateInbodyDto {
  @IsString()
  userId: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @Min(0)
  weight: number; // 체중 (kg)

  @IsNumber()
  @Min(0)
  skeletalMuscle: number; // 골격근량 (kg)

  @IsOptional()
  @IsNumber()
  @Min(0)
  bodyFat?: number; // 체지방량 (kg)

  @IsOptional()
  @IsNumber()
  @Min(0)
  bodyFatPercent?: number; // 체지방률 (%)

  @IsOptional()
  @IsNumber()
  @Min(0)
  bmi?: number; // BMI

  @IsOptional()
  @IsNumber()
  @Min(0)
  basalMetabolic?: number; // 기초대사량 (kcal)
}








