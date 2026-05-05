import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OtpType } from '../schema/otp.schema';

export class RequestOtpDto {
  @ApiProperty({
    enum: OtpType,
    enumName: 'OtpType',
    description: 'The type of OTP being requested',
    example: OtpType.EMAIL_VERIFICATION,
  })
  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;

  @ApiPropertyOptional({
    description: 'The email address of the user. Required when phone is not provided.',
    example: 'user@example.com',
    required: false,
  })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'The phone number of the user. Required when email is not provided.',
    example: '+1234567890',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'The name of the user, used for personalized greeting in OTP emails',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({
    description: 'The email address. Required when phone is not provided.',
    example: 'user@example.com',
  })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'The phone number. Required when email is not provided.',
    example: '+1234567890',
  })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiProperty({
    description: 'The 6-digit OTP code sent to the user',
    example: '482931',
    minLength: 6,
    maxLength: 6,
    required: true,
  })
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;
}
