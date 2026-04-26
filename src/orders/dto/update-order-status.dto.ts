import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../schema/order.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: 'The updated status of the order' })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'The updated payment status of the order' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}