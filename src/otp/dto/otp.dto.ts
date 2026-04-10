import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '../schema/otp.schema';

export class RequestOtpDto {
  @ApiProperty({ enum: OtpType, description: 'Type of OTP requested' })
  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;

  @ApiProperty({ description: 'The email address of the user (required if phone is not provided)', required: false })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({ description: 'The phone number of the user (required if email is not provided)', required: false })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiProperty({ description: 'The name of the user for greeting in emails', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

export class OtpVerifyDto {
  @ApiProperty({ enum: OtpType, description: 'Type of OTP to verify' })
  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;

  @ApiProperty({ description: 'The email address of the user (required if phone is not provided)', required: false })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({ description: 'The phone number of the user (required if email is not provided)', required: false })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiProperty({ description: 'The 6-digit OTP code' })
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;
}
