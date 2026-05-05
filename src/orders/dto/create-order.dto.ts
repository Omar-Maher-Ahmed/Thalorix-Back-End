import { IsMongoId, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'The ID of the template being ordered', example: '60d5ecb8b392d7001f8e8e30' })
  @IsMongoId()
  @IsNotEmpty()
  templateId: string;

  @ApiPropertyOptional({ description: 'The quantity of items being ordered', example: 1, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;
}