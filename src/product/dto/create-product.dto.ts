import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    IsMongoId,
    MinLength,
    MaxLength,
    Min,
    Max,
    IsBoolean,
    ArrayMaxSize,
    IsUrl,
    IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(120)
    @ApiProperty()
    name: string;


    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(50)
    @ApiProperty()
    sku?: string; // Stock Keeping Unit


    @IsOptional()
    @IsString()
    @MaxLength(2000)
    @ApiPropertyOptional()
    description?: string;


    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100000000)
    @ApiProperty()
    price: number;


    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(1000000)
    @ApiProperty()
    stock: number;


    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsUrl({}, { each: true })
    @ApiPropertyOptional({ type: [String] })
    images?: string[];


    @IsMongoId()
    @IsNotEmpty()
    @ApiProperty()
    category: string;


    @IsMongoId()
    @IsNotEmpty()
    @ApiProperty()
    marketplace: string;


    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional()
    isAvailable?: boolean;
}
