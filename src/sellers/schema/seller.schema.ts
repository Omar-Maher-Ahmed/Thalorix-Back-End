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
    default: false,
  })
  isDeleted: boolean;

  @Prop({
    type: String,
    enum: ['seller'],
    default: 'seller',
  })
  role: string;

  @Prop({
    required: false,
  })
  lastLogin?: Date;

  @Prop({ required: false, trim: true })
  storeName?: string;

  @Prop({ required: false, trim: true })
  storeDescription?: string;

  @Prop({ required: false })
  logo?: string;

  @Prop({ required: false })
  banner?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false, trim: true })
  businessCategory?: string;

  @Prop({ required: false, trim: true })
  website?: string;

  @Prop({
    type: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    default: { facebook: '', instagram: '', linkedin: '', twitter: '', website: '' },
  })
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };

  @Prop({ required: false, trim: true })
  businessType?: string;

  @Prop({ required: false, trim: true })
  taxNumber?: string;

  @Prop({ type: [String], default: [] })
  verificationDocuments: string[];

  @Prop({ default: 5 })
  ratings: number;

  @Prop({ default: 0 })
  reviewsCount: number;

  @Prop({ default: 0 })
  salesCount: number;

  @Prop({ default: 0 })
  downloadsCount: number;

  @Prop({ default: 0 })
  followersCount: number;

  @Prop({ default: 0 })
  followingCount: number;

  // Needed for standard Auth JWT validation
  @Prop({ required: false, select: false })
  currentAccessToken?: string;

  @Prop({ required: false, select: false })
  refreshToken?: string;
}

export const SellerSchema = SchemaFactory.createForClass(Seller);

