import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {

  @ApiPropertyOptional({ description: 'The email address of the user', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ description: 'The name of the user', example: 'John Doe', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name is too short' })
  name?: string;

  @ApiPropertyOptional({ description: 'The phone number of the user', example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ description: 'The token version of the user', example: 1 })
  @IsOptional()
  @IsNumberString()
  tokenVersion?: number;
}