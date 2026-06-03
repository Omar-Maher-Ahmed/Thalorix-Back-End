import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({ description: 'Order ID to create payment session for', example: '60d5ecb8b392d7001f8e8e30' })
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ description: 'Frontend success URL for redirect', example: 'http://localhost:3000/success' })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'Frontend cancel URL for redirect / mobile deep links', example: 'http://localhost:3000/cancel' })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}