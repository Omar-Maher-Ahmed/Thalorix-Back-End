import { IsString, IsMongoId, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateCategoryDto {

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsMongoId()
  marketplaceId: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;
}
