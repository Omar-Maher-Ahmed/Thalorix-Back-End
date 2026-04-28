import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySellerDto {
  @ApiPropertyOptional({ description: 'Number of sellers per page', example: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Search sellers by name or email', type: String })
  @IsOptional()
  @IsString()
  search?: string;
}
