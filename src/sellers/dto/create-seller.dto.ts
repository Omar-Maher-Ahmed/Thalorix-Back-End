import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateSellerDto {
  @ApiProperty({ description: 'The full name of the seller', example: 'Jane Doe' })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ description: 'The email address of the seller', example: 'seller@example.com' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ description: 'The phone number of the seller', example: '+1234567890' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({ description: 'The password', example: 'StrongP@ssw0rd', minLength: 8 })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // Basic strong password regex (optional, adjust based on needs)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  password: string;

  // Optional business fields
  @ApiPropertyOptional({ description: 'The store name', example: 'Tech Haven' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Store name cannot be empty' })
  @MaxLength(100, { message: 'Store name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  storeName?: string;

  @ApiPropertyOptional({ description: 'The store description', example: 'We sell the best tech gadgets.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  storeDescription?: string;

  @ApiPropertyOptional({ description: 'URL to the store logo', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl({}, { message: 'Logo must be a valid URL' })
  logo?: string;

  @ApiPropertyOptional({ description: 'The physical address of the store', example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  address?: string;
}
