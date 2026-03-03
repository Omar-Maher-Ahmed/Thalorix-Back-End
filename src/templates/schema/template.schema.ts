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
