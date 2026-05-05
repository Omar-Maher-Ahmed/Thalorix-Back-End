import { IsEmail, IsString } from 'class-validator';
import { ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Step 1 of the forgot-password flow.
 *
 * The user provides either their email OR phone number.
 * The service will look up the account and send a PASSWORD_RESET OTP.
 *
 * Used by: POST /auth/forgot-password
 */
export class ForgotPasswordDto {
  @ApiPropertyOptional({
    description:
      'Email address of the account. Required when phone is not provided.',
    example: 'user@example.com',
    required: false,
  })
  @ValidateIf((o) => !o.phone)
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description:
      'Phone number of the account. Required when email is not provided.',
    example: '+1234567890',
    required: false,
  })
  @ValidateIf((o) => !o.email)
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;
}
