import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SellerDocument = Seller & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  collection: 'sellers',
})
export class Seller {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    unique: true,
  })
  phone: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    default: false,
  })
  isVerified: boolean;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    type: String,
    enum: ['seller'],
    default: 'seller',
  })
  role: string;

  @Prop({
    required: false,
    select: false, // OTP is sensitive
  })
  otp?: string;

  @Prop({
    required: false,
    select: false,
  })
  otpExpiresAt?: Date;

  @Prop({
    required: false,
  })
  lastLogin?: Date;

  // Business-related optional fields
  @Prop({ required: false, trim: true })
  storeName?: string;

  @Prop({ required: false, trim: true })
  storeDescription?: string;

  @Prop({ required: false })
  logo?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ default: 0 })
  ratings: number;

  // Needed for standard Auth JWT validation
  @Prop({ required: false, select: false })
  currentAccessToken?: string;

  @Prop({ required: false, select: false })
  refreshToken?: string;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);
