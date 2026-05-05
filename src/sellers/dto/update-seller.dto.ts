import {
  IsString,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  IsPhoneNumber,
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
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
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
  @IsUrl({}, { message: 'Logo must be a valid URL' })
  logo?: string;

  @ApiPropertyOptional({ description: 'The physical address of the store', example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  address?: string;
}
