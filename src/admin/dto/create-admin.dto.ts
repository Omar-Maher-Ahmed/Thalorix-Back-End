import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  MinLength,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ description: 'The name of the admin', example: 'John Doe', required: true })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\u0600-\u06FFa-zA-Z0-9\s._-]+$/, {
    message: 'Name must contain only letters, numbers, spaces, dots, underscores, and hyphens',
  })
  name: string;

  @ApiProperty({ description: 'The email address of the admin', example: 'admin@example.com', required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The phone number of the admin', example: '+1234567890', required: true })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'The password for the admin account', example: 'StrongP@ssw0rd', required: true, minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}