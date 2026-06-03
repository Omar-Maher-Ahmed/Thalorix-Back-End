import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutItemDto {
  @ApiProperty({ description: 'The name of the item', example: 'Premium Plan' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'The amount for the item in cents', example: 1000, minimum: 50 })
    @IsNumber()
    @Min(50) 
    amount: number;

    @ApiProperty({ description: 'The quantity of the item', example: 1, minimum: 1 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiPropertyOptional({ description: 'URL of the item image' })
    @IsOptional()
    @IsString()
    images?: string;
}

export class CreateCheckoutSessionDto {
    @ApiProperty({ type: [CheckoutItemDto], description: 'List of items for checkout' })
    @IsArray()
    items: CheckoutItemDto[];

    @ApiPropertyOptional({ description: 'The email of the customer', example: 'customer@example.com' })
    @IsOptional()
    @IsEmail()
    customerEmail?: string;

    @ApiPropertyOptional({ description: 'Order ID to be passed to webhook metadata', example: '60d5ecb8b392d7001f8e8e30' })
    @IsOptional()
    @IsString()
    orderId?: string;

    @ApiPropertyOptional({ description: 'Frontend success URL for redirect', example: 'http://localhost:3000/success' })
    @IsOptional()
    @IsString()
    successUrl?: string;
}