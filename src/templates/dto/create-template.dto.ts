import { IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTemplateDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    price: number;

    @IsMongoId()
    marketplaceId: string;

    @IsMongoId()
    categoryId: string;
}
