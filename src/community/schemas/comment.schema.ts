import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true })
  postId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ['User', 'Seller', 'Admin'], default: 'User' })
  userModel: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  content: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);