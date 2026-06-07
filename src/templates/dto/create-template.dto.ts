import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
    @ApiProperty({ description: 'The title of the template', example: 'E-commerce Theme' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string;

    @ApiProperty({ description: 'Description of the template' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ description: 'The price of the template', example: 29.99 })
    @Type(() => Number)
    @IsNumber()
    price: number;

    @ApiPropertyOptional({ description: 'URL link to the downloadable template file', example: 'https://example.com/template.zip' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    fileUrl?: string;

    @ApiProperty({ description: 'The associated category ID', example: '60d5ecb8b392d7001f8e8e31' })
    @IsMongoId()
    categoryId: string;

    @ApiPropertyOptional({ description: 'URL of the template thumbnail image', example: 'https://example.com/image.png' })
    @IsOptional()
    @IsString()
    image?: string;

    @ApiPropertyOptional({ description: 'Size of the template file', example: '2.5 MB' })
    @IsOptional()
    @IsString()
    fileSize?: string;

    @ApiPropertyOptional({ description: 'Format of the template file', example: 'ZIP / Figma' })
    @IsOptional()
    @IsString()
    format?: string;

    @ApiPropertyOptional({ description: 'Dimensions if applicable', example: '1920x1080' })
    @IsOptional()
    @IsString()
    dimensions?: string;

    @ApiPropertyOptional({ description: 'License type', example: 'Standard License' })
    @IsOptional()
    @IsString()
    license?: string;
}
