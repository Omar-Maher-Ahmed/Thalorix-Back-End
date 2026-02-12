import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CheckoutItemDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(50) 
    amount: number;

    @IsNumber()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    images?: string;
}

export class CreateCheckoutSessionDto {
    @IsArray()
    items: CheckoutItemDto[];

    @IsOptional()
    @IsEmail()
    customerEmail?: string;
}