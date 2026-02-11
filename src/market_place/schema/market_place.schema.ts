import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type MarketPlaceDocument = MarketPlace & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class MarketPlace {
  @Prop({
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 120,
    index: true,
  })
  title: string;

  @Prop({
    trim: true,
    maxlength: 2000,
  })
  description?: string;

  @Prop({
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  })
  category?: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  owner: mongoose.Types.ObjectId;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const MarketPlaceSchema = SchemaFactory.createForClass(MarketPlace);
MarketPlaceSchema.index({ title: 'text', description: 'text' });


