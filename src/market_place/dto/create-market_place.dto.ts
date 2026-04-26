import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarketPlaceDto {
  @ApiProperty({ description: 'The name of the marketplace item', example: 'Web Template', minLength: 3, maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the marketplace item', example: 'A highly customizable web template', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'The price of the item', example: 49.99, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'The ID of the associated template', example: '60d5ecb8b392d7001f8e8e30' })
  @IsMongoId()
  templateId: string;

  @ApiProperty({ description: 'The currency code for the price', example: 'USD' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ description: 'Array of image URLs for the item', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'The category ID for the item', example: '60d5ecb8b392d7001f8e8e31' })
  @IsOptional()
  @IsMongoId()
  category?: string;
}

