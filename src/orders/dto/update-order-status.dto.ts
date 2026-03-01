import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../schema/order.schema';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}