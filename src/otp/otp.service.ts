import {
  BadRequestException,
  Injectable,
  HttpException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import { Otp, OtpType } from './schema/otp.schema';
import { OtpNotificationService } from './otp-notification.service';

const OTP_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    private readonly notification: OtpNotificationService,
  ) {}

  /**
   * Create and send an OTP.
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

    // Step 1: Generate plain code
    const code = randomInt(100000, 999999).toString();

    // Step 2: Send notification FIRST — before saving to DB.
    // This prevents orphaned DB records that would get marked as used
    // on the next retry, making verification permanently fail.
    try {
      if (options.email) {
        await this.notification.sendByEmail(options.email, code, type, options.name);
      } else if (options.phone) {
        await this.notification.sendByPhone(options.phone, code, type);
      }
    } catch (error) {
      this.logger.error(`Failed to send OTP notification to ${identifier}: ${error.message}`);
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }

    // Step 3: Notification succeeded — invalidate old OTPs then save the new one
    try {
      await this.markExistingOtpsUsed(type, options);

      await this.otpModel.create({
        code,
        userId: options.userId
          ? new Types.ObjectId(options.userId.toString())
          : undefined,
        email: options.email?.toLowerCase(),
        phone: options.phone,
        type,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        isUsed: false,
      });

      this.logger.log(`OTP created and sent successfully to ${identifier} for ${type}`);
      return code;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to save OTP record for ${identifier}: ${error.message}`);
      throw new InternalServerErrorException('OTP was sent but could not be saved. Please try again.');
    }
  }

  /**
   * Validate an OTP and mark it as used.
   */
  async validateOtp(
    inputCode: string,
    type: OtpType,
    options: { userId?: string | Types.ObjectId; email?: string; phone?: string },
  ): Promise<boolean> {
    const identifier = this.resolveIdentifier(options);
    const filter = this.buildOtpFilter(type, options);

    try {
      const otp = await this.otpModel
        .findOne({ ...filter, isUsed: false, expiresAt: { $gt: new Date() } })
        .sort({ createdAt: -1 });

      if (!otp) {
        this.logger.warn(`OTP validation failed: No active OTP found for ${identifier}`);
        throw new BadRequestException('Invalid or expired OTP');
      }

      if (otp.code !== inputCode) {
        this.logger.warn(`OTP validation failed: Incorrect code for ${identifier}`);
        throw new BadRequestException('Invalid OTP code');
      }

      // Mark the OTP as used
      otp.isUsed = true;
      await otp.save();

      this.logger.log(`OTP validated successfully for ${identifier} (${type})`);
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error validating OTP for ${identifier}: ${error.message}`);
      throw new InternalServerErrorException('Error validating OTP');
    }
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
    if (options.email) {
      filter.email = options.email.toLowerCase();
    } else if (options.phone) {
      filter.phone = options.phone;
    } else if (options.userId) {
      filter.userId = new Types.ObjectId(options.userId.toString());
    }
    return filter;
  }
}
