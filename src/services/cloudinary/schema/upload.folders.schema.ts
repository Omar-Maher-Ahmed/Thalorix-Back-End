import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FolderDocument = Folder & Document;

@Schema({ timestamps: true })
export class Folder {

  @Prop({ required: true })
  name: string; 

  @Prop({ required: true, unique: true })
  slug: string; 

  @Prop({ required: true })
  path: string; 

  @Prop({ type: [String], default: [] })
  allowedFormats: string[];

  @Prop({ default: 5 }) 
  maxSizeMB: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);