
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: false })
  content?: string;

  @Prop()
  image?: string;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

}

export const PostSchema = SchemaFactory.createForClass(Post);