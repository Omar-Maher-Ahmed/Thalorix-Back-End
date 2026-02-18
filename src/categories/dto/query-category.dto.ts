import { IsOptional, IsNumberString, IsString, IsMongoId } from 'class-validator';


export class QueryCategoryDto {

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsMongoId()
  marketplaceId?: string;
}
