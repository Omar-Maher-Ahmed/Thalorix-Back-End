import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Tracks per-user OTP request history and cooldowns.
 *
 * Cooldown ladder:
 *   #1 → immediately
 *   #2 → wait 3 min
 *   #3 → wait 15 min
 *   #4 → wait 1 hour
 *   #5 → wait 24 hours
 *   #6 → permanent lock (contact support, auto-reset after 48 h)
 */
@Schema({
  timestamps: true,
  collection: 'otp_rate_limits',
})
export class OtpRateLimit extends Document {
  /**
   * Unique key: email | phone | userId string.
   * The service always passes a consistent identifier.
   */
  @Prop({ required: true, unique: true, index: true })
  identifier: string;

  /** Total OTP requests made (resets when resetAt passes). */
  @Prop({ default: 0 })
  requestCount: number;

  /**
   * The earliest time at which the next OTP request is allowed.
   * null means "allowed now".
   */
  @Prop({ default: null })
  lockedUntil: Date | null;

  /** true when requestCount has exceeded the max (5). */
  @Prop({ default: false })
  isPermanentlyLocked: boolean;

  /**
   * When isPermanentlyLocked, the system auto-resets after 48 h.
   * Null when not permanently locked.
   */
  @Prop({ default: null })
  resetAt: Date | null;
}

export const OtpRateLimitSchema = SchemaFactory.createForClass(OtpRateLimit);
