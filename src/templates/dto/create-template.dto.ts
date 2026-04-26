import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
    @ApiProperty({ description: 'The name of the template', example: 'E-commerce Theme' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the template' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'The price of the template', example: 29.99 })
    @Type(() => Number)
    @IsNumber()
    price: number;

    @ApiProperty({ description: 'The associated marketplace ID', example: '60d5ecb8b392d7001f8e8e30' })
    @IsMongoId()
    marketplaceId: string;

    @ApiProperty({ description: 'The associated category ID', example: '60d5ecb8b392d7001f8e8e31' })
    @IsMongoId()
    categoryId: string;
}
