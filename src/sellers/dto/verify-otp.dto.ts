import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class VerifyOtpDto {
  @ApiProperty({ description: 'The email address of the seller', example: 'seller@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ description: 'The 4-6 digit OTP code', example: '123456' })
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(4, 6, { message: 'OTP must be between 4 and 6 characters' })
  code: string;
}

export class ResendOtpDto {
  @ApiProperty({ description: 'The email address of the seller', example: 'seller@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}
