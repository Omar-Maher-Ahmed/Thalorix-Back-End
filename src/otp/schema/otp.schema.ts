import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
}

@Schema({
  timestamps: true,
  collection: 'otps',
})
export class Otp extends Document {
  // Stored as bcrypt hash — never plain text
  @Prop({ required: true })
  hashedCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: Types.ObjectId;

  @Prop({ required: false, lowercase: true })
  email?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({
    type: String,
    enum: Object.values(OtpType),
    required: true,
  })
  type: OtpType;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// MongoDB auto-deletes the document from the collection after expiresAt
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
