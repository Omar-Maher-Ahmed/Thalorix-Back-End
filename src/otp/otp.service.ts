//generate OTP
//store OTP (DB أو Redis)
//validate OTP
//expire OTP



import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Otp, OtpType } from './schema/otp.schema';
import { OtpRateLimit } from './schema/otp-rate-limit.schema';

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
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    @InjectModel(OtpRateLimit.name)
    private readonly rateLimitModel: Model<OtpRateLimit>,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Generate, hash, and store an OTP.
   * Enforces rate limiting and hybrid invalidation.
   * Returns the plain-text code (to be sent via email/SMS).
   */
  async createOtp(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<string> {
    const identifier = this.resolveIdentifier(options);

    // 1. Rate limit gate
    await this.checkRateLimit(identifier);

    // 2. Hybrid invalidation — if a valid OTP still exists, tell user to wait
    await this.rejectIfActiveOtpExists(type, options);

    // 3. Generate random 6-digit code (CSPRNG)
    const plainCode = randomInt(100_000, 1_000_000).toString();

    // 4. Hash before storing
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
    await this.recordRequest(identifier);

    // Return plain code — caller must send it via email/SMS
    return plainCode;
  }

  /**
   * Validate an OTP atomically.
   * Marks it as used in a single findOneAndUpdate call to prevent race conditions.
   */
  async validateOtp(
    inputCode: string,
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<boolean> {
    const filter = this.buildOtpFilter(type, options);

    // Atomic: find a valid, unused, non-expired OTP and mark it used in one query
    const otp = await this.otpModel.findOneAndUpdate(
      { ...filter, isUsed: false, expiresAt: { $gt: new Date() } },
      { $set: { isUsed: true } },
      { new: false }, // return the document BEFORE update so we can read hashedCode
    );

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Compare plain input against stored hash
    const isMatch = await bcrypt.compare(inputCode, otp.hashedCode);
    if (!isMatch) {
      // Un-mark as used so the real code can still be tried
      await this.otpModel.findByIdAndUpdate(otp._id, { $set: { isUsed: false } });
      throw new BadRequestException('Invalid or expired OTP');
    }

    return true;
  }

  /**
   * Manually expire all active OTPs for a user+type.
   * Use when you want to cancel an outstanding OTP (e.g. user changed email).
   */
  async expireAllOtps(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<void> {
    await this.markExistingOtpsUsed(type, options);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RATE LIMITING
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Reads the rate limit record for this identifier.
   * Throws 429 if the user is locked or still in a cooldown window.
   */
  private async checkRateLimit(identifier: string): Promise<void> {
    const record = await this.rateLimitModel.findOne({ identifier });
    if (!record) return; // first request ever — always allowed

    const now = new Date();

    // ── Permanent lock ──
    if (record.isPermanentlyLocked) {
      // Auto-reset after 48 h
      if (record.resetAt && record.resetAt <= now) {
        await this.rateLimitModel.findOneAndUpdate(
          { identifier },
          {
            $set: {
              requestCount: 0,
              isPermanentlyLocked: false,
              lockedUntil: null,
              resetAt: null,
            },
          },
        );
        return; // allowed after reset
      }

      const msLeft = record.resetAt ? record.resetAt.getTime() - now.getTime() : 0;
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Account locked due to too many OTP requests. Please contact technical support or try again after ${msToHuman(msLeft)}.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ── Cooldown window ──
    if (record.lockedUntil && record.lockedUntil > now) {
      const msLeft = record.lockedUntil.getTime() - now.getTime();
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many OTP requests. Please wait ${msToHuman(msLeft)} before requesting a new code.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Increments requestCount and sets the next lockedUntil based on cooldown ladder.
   * If count reaches MAX_REQUESTS → permanently lock.
   */
  private async recordRequest(identifier: string): Promise<void> {
    const record = await this.rateLimitModel.findOneAndUpdate(
      { identifier },
      { $inc: { requestCount: 1 } },
      { new: true, upsert: true },
    );

    const count = record.requestCount;

    // Reached the max → permanent lock for 48 h
    if (count >= MAX_REQUESTS) {
      await this.rateLimitModel.findOneAndUpdate(
        { identifier },
        {
          $set: {
            isPermanentlyLocked: true,
            lockedUntil: null,
            resetAt: new Date(Date.now() + PERMANENT_LOCK_RESET_MS),
          },
        },
      );
      return;
    }

    // Set the cooldown for the NEXT request
    const nextCooldown = COOLDOWNS_MS[count]; // count is now after increment
    if (nextCooldown > 0) {
      await this.rateLimitModel.findOneAndUpdate(
        { identifier },
        { $set: { lockedUntil: new Date(Date.now() + nextCooldown) } },
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // HYBRID INVALIDATION
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Option 3 — Hybrid:
   *   - If a valid (non-expired, non-used) OTP exists → reject with a clear message.
   *   - If the existing OTP is expired or used → mark it used and allow a new one.
   */
  private async rejectIfActiveOtpExists(
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<void> {
    const filter = this.buildOtpFilter(type, options);

    const existing = await this.otpModel.findOne({
      ...filter,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      const msLeft = existing.expiresAt.getTime() - Date.now();
      throw new BadRequestException(
        `You already have an active OTP. Please use it or wait ${msToHuman(msLeft)} for it to expire.`,
      );
    }

    // No valid OTP → expire stale ones and allow a new one
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

  /** Builds a consistent string key for the rate limit record. */
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
