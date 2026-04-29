import { IsOptional, IsNumberString, IsString, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class QueryCategoryDto {

  @ApiPropertyOptional({ description: 'The page number for pagination', example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'The limit of items per page', example: '10' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ description: 'A keyword to search for categories', example: 'laptops' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
