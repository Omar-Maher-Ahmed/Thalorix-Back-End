
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, enum: ['User', 'Seller', 'Admin'], default: 'User' })
  userModel: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop()
  image?: string;

  @Prop()
  link?: string;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

}

export const PostSchema = SchemaFactory.createForClass(Post);