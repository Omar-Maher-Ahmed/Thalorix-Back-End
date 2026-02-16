import { IsString, IsMongoId } from 'class-validator';
export class CreateCategoryDto {

    @IsString()
    name: string;

    @IsMongoId()
    marketplaceId: string;
}
