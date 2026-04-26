import { IsEmail, IsString, Length, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class ResetPasswordDto {
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

  @ApiProperty({
    description: 'The 6-digit OTP code sent to the user for password reset',
    example: '482931',
    minLength: 6,
    maxLength: 6,
    required: true,
  })
  @IsString({ message: 'Code must be a string' })
  @Length(6, 6, { message: 'Code must be exactly 6 digits' })
  code: string;

  @ApiProperty({
    description: 'The new password. Must contain uppercase, lowercase, a number, and a special character.',
    example: 'NewP@ssw0rd!',
    minLength: 8,
    required: true,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  newPassword: string;
}

