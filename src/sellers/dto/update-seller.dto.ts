import {
  IsString,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateSellerDto {
  @ApiPropertyOptional({ description: 'The full name of the seller', example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ description: 'The phone number of the seller', example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'The store name', example: 'Tech Haven' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  storeName?: string;

  @ApiPropertyOptional({ description: 'The store description', example: 'We sell the best tech gadgets.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  storeDescription?: string;

  @ApiPropertyOptional({ description: 'URL to the store logo', example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'URL to the store banner', example: 'https://example.com/banner.png' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ description: 'The physical address of the store', example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({ description: 'Business category of the store', example: 'Development' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  businessCategory?: string;

  @ApiPropertyOptional({ description: 'Website URL of the store', example: 'https://store.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Social links of the store', example: { facebook: '', instagram: '' } })
  @IsOptional()
  @IsObject()
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };

  @ApiPropertyOptional({ description: 'Business registration type', example: 'LLC' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  businessType?: string;

  @ApiPropertyOptional({ description: 'Business tax number', example: 'TX-1234567' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Verification documents list', example: ['https://doc.com/pdf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verificationDocuments?: string[];

  @ApiPropertyOptional({ description: 'Whether the seller account is active', example: true })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Whether the seller account is verified', example: true })
  @IsOptional()
  isVerified?: boolean;
}

