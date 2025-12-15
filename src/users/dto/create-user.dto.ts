import { IsString, IsInt, IsNumber, Min, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  gender: string; // 'MALE' or 'FEMALE'

  @IsInt()
  @Min(1)
  age: number;

  @IsNumber()
  @Min(0)
  height: number; // cm

  @IsNumber()
  @Min(0)
  weight: number; // kg
}
