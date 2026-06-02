import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[]; // دايماً 2 يوزرز

  @Prop({ type: String, enum: ['direct', 'group'], default: 'direct' })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage: Types.ObjectId;

  @Prop({ default: 0 })
  unreadCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  deletedBy: Types.ObjectId[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Index عشان نجيب المحادثة بين يوزرين بسرعة
ConversationSchema.index({ participants: 1 });