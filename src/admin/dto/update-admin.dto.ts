import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsOptional,
  IsNumberString,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminDto {
  @ApiPropertyOptional({ description: 'The email address of the admin', example: 'admin@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ description: 'The name of the admin', example: 'John Doe', minLength: 2 })
  @IsOptional()
  @IsString()
  @Matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, {
    message: 'Name must contain only letters and spaces',
  })
  @MinLength(2, { message: 'Name is too short' })
  name?: string;

  @ApiPropertyOptional({ description: 'The phone number of the admin', example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ description: 'The token version for the admin', example: 1 })
  @IsOptional()
  @IsNumberString()
  tokenVersion?: number;
}
