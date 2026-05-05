
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

// export enum OrderStatus {
//   PENDING = 'pending',
//   PAID = 'paid',
//   CANCELLED = 'cancelled',
//   COMPLETED = 'completed',
// }
export enum OrderStatus {
  PENDING = 'pending',        // 
  PROCESSING = 'processing',  // 
  COMPLETED = 'completed',    // 
  CANCELLED = 'cancelled',    // 
}

// export enum PaymentStatus {
//   UNPAID = 'unpaid',
//   PAID = 'paid',
//   FAILED = 'failed',
//   REFUNDED = 'refunded',
// }

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  buyer: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  seller: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true,
  })
  template: mongoose.Types.ObjectId;

  // Snapshot price
  @Prop({ required: true })
  price: number;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentMethod?: string;

  @Prop()
  gatewayRefId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);