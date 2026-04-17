import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Otp, OtpType } from './schema/otp.schema';
import { OtpRateLimit } from './schema/otp-rate-limit.schema';
import { OtpNotificationService } from './otp-notification.service';

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const BCRYPT_ROUNDS = 10;
const MAX_REQUESTS = 5;
const PERMANENT_LOCK_RESET_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Cooldown to wait BEFORE the Nth request is allowed.
 * Index 0 → first request (no wait), index 4 → 5th request (wait 24h).
 */
const COOLDOWNS_MS = [
  0,                      // #1 → immediately
  3 * 60 * 1000,          // #2 → 3 minutes
  15 * 60 * 1000,         // #3 → 15 minutes
  60 * 60 * 1000,         // #4 → 1 hour
  24 * 60 * 60 * 1000,    // #5 → 24 hours
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function msToHuman(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second(s)`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute(s)`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `${hours} hour(s)`;
  return `${Math.ceil(hours / 24)} day(s)`;
}

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    @InjectModel(OtpRateLimit.name)
    private readonly rateLimitModel: Model<OtpRateLimit>,
    private readonly notification: OtpNotificationService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Generate, hash, and store an OTP — then deliver it via email or phone.
   */
  async createOtp(
    type: OtpType,
    options: {
      userId?: string | Types.ObjectId;
      email?: string;
      phone?: string;
      name?: string;
    },
  ): Promise<string> {
    const identifier = this.resolveIdentifier(options);

    try {
      // 1. Rate limit gate
      // await this.checkRateLimit(identifier);

      // 2. Hybrid invalidation — if a valid OTP still exists, tell user to wait
      // await this.rejectIfActiveOtpExists(type, options);

      // 3. Generate random 6-digit code (CSPRNG)
      const plainCode = randomInt(100_000, 1_000_000).toString();

      // 4. Hash before storing (handled with care for hashing delays)
      const hashedCode = await bcrypt.hash(plainCode, BCRYPT_ROUNDS);

      // 5. Save OTP document
      await this.otpModel.create({
        hashedCode,
        userId: options.userId ? new Types.ObjectId(options.userId.toString()) : undefined,
        email: options.email,
        phone: options.phone,
        type,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        isUsed: false,
      });

      // 6. Record this request in the rate limit tracker
      // await this.recordRequest(identifier);

      // 7. Deliver OTP via the appropriate channel
      if (options.email) {
        await this.notification.sendByEmail(options.email, plainCode, type, options.name);
      } else if (options.phone) {
        await this.notification.sendByPhone(options.phone, plainCode, type);
      }

      this.logger.log(`OTP created and sent successfully to ${identifier} for ${type}`);

      // In production, you might not return this, but keeping for dev/testing as per current logic
      return plainCode;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to create OTP for ${identifier}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process OTP request. Please try again later.');
    }
  }

  /**
   * Validate an OTP atomically.
   */
  async validateOtp(
    inputCode: string,
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<boolean> {
    const identifier = this.resolveIdentifier(options);
    const filter = this.buildOtpFilter(type, options);

    try {
      // Atomic: find a valid, unused, non-expired OTP and mark it used in one query
      const otp = await this.otpModel.findOneAndUpdate(
        { ...filter, isUsed: false, expiresAt: { $gt: new Date() } },
        { $set: { isUsed: true } },
        { new: false },
      );

      if (!otp) {
        this.logger.warn(`OTP validation failed: No active OTP found for ${identifier}`);
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Compare plain input against stored hash
      const isMatch = await bcrypt.compare(inputCode, otp.hashedCode);
      if (!isMatch) {
        this.logger.warn(`OTP validation failed: Incorrect code for ${identifier}`);
        // Un-mark as used so the real code can still be tried
        await this.otpModel.findByIdAndUpdate(otp._id, { $set: { isUsed: false } });
        throw new BadRequestException('Invalid or expired OTP');
      }

      this.logger.log(`OTP validated successfully for ${identifier}`);
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error during OTP validation for ${identifier}: ${error.message}`);
      throw new InternalServerErrorException('Validation service unavailable');
    }
  }

  /**
   * Manually expire all active OTPs for a user+type.
   */
  async expireAllOtps(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<void> {
    try {
      await this.markExistingOtpsUsed(type, options);
    } catch (error) {
      this.logger.error(`Failed to expire OTPs: ${error.message}`);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RATE LIMITING
  // ────────────────────────────────────────────────────────────────────────────

  // private async checkRateLimit(identifier: string): Promise<void> {
  //   const record = await this.rateLimitModel.findOne({ identifier });
  //   if (!record) return;

  //   const now = new Date();

  //   // ── Permanent lock ──
  //   if (record.isPermanentlyLocked) {
  //     if (record.resetAt && record.resetAt <= now) {
  //       this.logger.log(`Hard lock expired for ${identifier}. Resetting rate limit.`);
  //       await this.rateLimitModel.findOneAndUpdate(
  //         { identifier },
  //         {
  //           $set: {
  //             requestCount: 0,
  //             isPermanentlyLocked: false,
  //             lockedUntil: null,
  //             resetAt: null,
  //           },
  //         },
  //       );
  //       return;
  //     }

  //     const msLeft = record.resetAt ? record.resetAt.getTime() - now.getTime() : 0;
  //     this.logger.warn(`Rate limit triggered: ${identifier} is permanently locked for ${msToHuman(msLeft)}`);
  //     throw new HttpException(
  //       {
  //         statusCode: HttpStatus.TOO_MANY_REQUESTS,
  //         message: `Account locked due to too many OTP requests. Please contact technical support or try again after ${msToHuman(msLeft)}.`,
  //       },
  //       HttpStatus.TOO_MANY_REQUESTS,
  //     );
  //   }

  //   // ── Cooldown window ──
  //   if (record.lockedUntil && record.lockedUntil > now) {
  //     const msLeft = record.lockedUntil.getTime() - now.getTime();
  //     this.logger.warn(`Rate limit triggered: ${identifier} is in cooldown for ${msToHuman(msLeft)}`);
  //     throw new HttpException(
  //       {
  //         statusCode: HttpStatus.TOO_MANY_REQUESTS,
  //         message: `Too many OTP requests. Please wait ${msToHuman(msLeft)} before requesting a new code.`,
  //       },
  //       HttpStatus.TOO_MANY_REQUESTS,
  //     );
  //   }
  // }

  // private async recordRequest(identifier: string): Promise<void> {
  //   const record = await this.rateLimitModel.findOneAndUpdate(
  //     { identifier },
  //     { $inc: { requestCount: 1 } },
  //     { new: true, upsert: true },
  //   );

  //   const count = record.requestCount;

  //   if (count >= MAX_REQUESTS) {
  //     this.logger.error(`DANGER: ${identifier} reached max requests. Applying 48h hard lock.`);
  //     await this.rateLimitModel.findOneAndUpdate(
  //       { identifier },
  //       {
  //         $set: {
  //           isPermanentlyLocked: true,
  //           lockedUntil: null,
  //           resetAt: new Date(Date.now() + PERMANENT_LOCK_RESET_MS),
  //         },
  //       },
  //     );
  //     return;
  //   }

  //   const nextCooldown = COOLDOWNS_MS[count];
  //   if (nextCooldown > 0) {
  //     this.logger.debug(`Setting next cooldown for ${identifier}: ${msToHuman(nextCooldown)}`);
  //     await this.rateLimitModel.findOneAndUpdate(
  //       { identifier },
  //       { $set: { lockedUntil: new Date(Date.now() + nextCooldown) } },
  //     );
  //   }
  // }

  // ────────────────────────────────────────────────────────────────────────────
  // HYBRID INVALIDATION
  // ────────────────────────────────────────────────────────────────────────────

  private async rejectIfActiveOtpExists(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<void> {
    const identifier = this.resolveIdentifier(options);
    const filter = this.buildOtpFilter(type, options);

    const existing = await this.otpModel.findOne({
      ...filter,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      const msLeft = existing.expiresAt.getTime() - Date.now();
      this.logger.warn(`Rejected OTP request for ${identifier}: Active OTP still exists.`);
      throw new BadRequestException(
        `You already have an active OTP. Please use it or wait ${msToHuman(msLeft)} for it to expire.`,
      );
    }

    await this.markExistingOtpsUsed(type, options);
  }

  private async markExistingOtpsUsed(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<void> {
    const filter = this.buildOtpFilter(type, options);
    await this.otpModel.updateMany(
      { ...filter, isUsed: false },
      { $set: { isUsed: true } },
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private resolveIdentifier(options: {
    userId?: string | Types.ObjectId;
    email?: string;
    phone?: string;
  }): string {
    if (options.email) return `email:${options.email.toLowerCase()}`;
    if (options.phone) return `phone:${options.phone}`;
    if (options.userId) return `user:${options.userId.toString()}`;
    throw new BadRequestException('At least one of email, phone, or userId is required');
  }

  private buildOtpFilter(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Record<string, any> {
    const filter: Record<string, any> = { type };
    if (options.userId) filter.userId = new Types.ObjectId(options.userId.toString());
    if (options.email) filter.email = options.email.toLowerCase();
    if (options.phone) filter.phone = options.phone;
    return filter;
  }
}
