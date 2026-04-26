import { IsString, IsMongoId, IsOptional, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {

  @ApiProperty({ description: 'The name of the category', example: 'Electronics', minLength: 2, maxLength: 80 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^(?! +$)[a-zA-Z0-9 ]+$/, { message: 'name must contain only letters, numbers, and spaces, and cannot be empty or only spaces' })
  name: string;

  @ApiProperty({ description: 'The marketplace ID this category belongs to', example: '60d5ecb8b392d7001f8e8e30' })
  @IsMongoId()
  marketplaceId: string;

  @ApiPropertyOptional({ description: 'The parent category ID if it is a subcategory', example: '60d5ecb8b392d7001f8e8e31' })
  @IsMongoId()
  @IsOptional()
  parentId?: string;
}
