import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'friend_requests',
})
export class FriendRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status: string;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

// Compound index to ensure only one pending request can exist between two users
FriendRequestSchema.index(
  { senderId: 1, receiverId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

FriendRequestSchema.index({ senderId: 1 });
FriendRequestSchema.index({ receiverId: 1 });
FriendRequestSchema.index({ status: 1 });
