import { IsEmail, IsString, Length, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The email address of the user (required if phone is not provided)' })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({ description: 'The phone number of the user (required if email is not provided)' })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @ApiProperty({ description: 'The 6-digit OTP code' })
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;

  @ApiProperty({ description: 'The new password for the user' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
