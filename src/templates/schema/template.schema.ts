// import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
// import { Types } from 'mongoose';
// import { Document } from 'mongoose';

// export type TemplateDocument = Template & Document;
// @Schema({ timestamps: true })
// export class Template {
//     @Prop({ required: true })
//     name: string;

//     @Prop()
//     description?: string;

//     @Prop({ type: Types.ObjectId, ref: 'User', required: true })
//     ownerId: Types.ObjectId;

//     @Prop({ type: Types.ObjectId, ref: 'Marketplace', required: true })
//     marketplaceId: Types.ObjectId;

//     @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
//     categoryId: Types.ObjectId;
// }
// export const TemplateSchema = SchemaFactory.createForClass(Template);
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  seller: string; // أو ObjectId لو عامل ref

  @Prop({ default: true })
  isActive: boolean;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
