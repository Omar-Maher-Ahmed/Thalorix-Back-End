import { IsOptional, IsNumber, IsString, IsMongoId, NotEquals, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMarketPlaceDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'The limit of items per page', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Minimum price filter', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by category MongoDB ObjectId', example: '60d5ecb8b392d7001f8e8e31' })
  @IsOptional()
  @NotEquals('Null')
  @NotEquals('undefined')
  @IsNotEmpty()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID', example: '60d5ecb8b392d7001f8e8e31' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search keyword to filter items', example: 'template' })
  @IsOptional()
  @NotEquals('Null')
  @NotEquals('undefined')
  @IsNotEmpty()
  @IsString()
  search?: string;
}
