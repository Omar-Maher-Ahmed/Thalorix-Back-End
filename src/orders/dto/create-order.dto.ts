import { IsMongoId, IsNotEmpty, IsOptional, IsInt, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'The ID of the template being ordered', example: '60d5ecb8b392d7001f8e8e30' })
  @IsMongoId()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ description: 'The quantity of items being ordered', example: 1, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'The ID of the template being ordered', example: '60d5ecb8b392d7001f8e8e30' })
  @IsOptional()
  @IsMongoId()
  templateId?: string;

  @ApiPropertyOptional({ description: 'The quantity of items being ordered', example: 1, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;

  @ApiPropertyOptional({ description: 'List of template IDs to purchase together', example: ['60d5ecb8b392d7001f8e8e30'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  templateIds?: string[];

  @ApiPropertyOptional({ description: 'List of items to purchase together', type: [OrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}