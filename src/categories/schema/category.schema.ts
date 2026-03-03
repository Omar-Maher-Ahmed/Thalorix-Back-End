import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Category {

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80,
    index: true,
  })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    unique: true,
    index: true,
  })
  slug: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Marketplace',
    required: true,
    index: true,
  })
  marketplaceId: Types.ObjectId;

  // parent category
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    default: null,
  })
  parentId: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
