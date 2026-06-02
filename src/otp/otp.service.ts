import {
  BadRequestException,
  Injectable,
  HttpException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import { Otp, OtpType } from './schema/otp.schema';
import { OtpNotificationService } from './otp-notification.service';
import { User } from '../users/schema/user.schema';
import { Seller } from '../sellers/schema/seller.schema';
import { Admin } from '../admin/schema/admin.schema';

const OTP_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<Otp>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
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

    const code = randomInt(100000, 999999).toString();

    // Print OTP to terminal for admin/seller (easy manual testing)
    if (type === OtpType.ADMIN_VERIFICATION || type === OtpType.SELLER_VERIFICATION) {
      this.logger.log(`\n==================================================`);
      this.logger.log(`  🔑 OTP for [${type}] → ${identifier}`);
      this.logger.log(`  📋 CODE: ${code}`);
      this.logger.log(`==================================================\n`);
    }

    // Send notification FIRST — before saving to DB
    try {
      if (options.email) {
        await this.notification.sendByEmail(options.email, code, type, options.name);
      } else if (options.phone) {
        await this.notification.sendByPhone(options.phone, code, type);
      }
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${identifier}: ${error.message}`);
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }

    // Notification succeeded — invalidate old OTPs then persist the new one
    try {
      await this.markExistingOtpsUsed(type, options);

      const newOtp = await this.otpModel.create({
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

      // DEBUG: Verify the OTP was saved correctly by re-reading it
      const verify = await this.otpModel.findById(newOtp._id).lean();
      this.logger.debug(`[createOtp] SAVED OTP → id=${verify?._id} code=${verify?.code} email=${verify?.email} type=${verify?.type} isUsed=${verify?.isUsed} expiresAt=${verify?.expiresAt}`);

      this.logger.log(`OTP created and sent to ${identifier} for ${type}`);
      return code;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to save OTP for ${identifier}: ${error.message}`);
      throw new InternalServerErrorException('OTP sent but could not be saved. Try again.');
    }
  }

  /**
   * Unified verify — auto-detects OTP type from DB, validates code,
   * then updates the correct entity (User / Seller isVerified).
   */
  async verifyAndUpdate(
    inputCode: string,
    options: { email?: string; phone?: string },
  ): Promise<{ message: string }> {
    const identifier = this.resolveIdentifier(options);

    // Build identifier filter (no type constraint — auto-detect)
    const identifierFilter: Record<string, any> = {};
    if (options.email) identifierFilter.email = options.email.toLowerCase();
    else if (options.phone) identifierFilter.phone = options.phone;

    this.logger.debug(`[verifyAndUpdate] identifier=${identifier} code=${inputCode}`);

    // DEBUG: Show ALL OTPs for this identifier regardless of status
    const allOtps = await this.otpModel.find(identifierFilter).sort({ createdAt: -1 }).lean();
    this.logger.debug(`[verifyAndUpdate] ALL OTPs in DB for ${identifier}: ${JSON.stringify(allOtps.map(o => ({ id: o._id, code: o.code, type: o.type, isUsed: o.isUsed, expiresAt: o.expiresAt })))}`);

    // Find the most recent active OTP for this identifier (any type)
    const otp = await this.otpModel
      .findOne({ ...identifierFilter, isUsed: false, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    if (!otp) {
      this.logger.warn(`[verifyAndUpdate] No active OTP found for ${identifier}. Now=${new Date().toISOString()}. Filter=${JSON.stringify(identifierFilter)}`);
      throw new BadRequestException('Invalid or expired OTP');
    }

    this.logger.debug(`[verifyAndUpdate] Found OTP → id=${otp._id} code=${otp.code} inputCode=${inputCode} match=${otp.code === inputCode} type=${otp.type} isUsed=${otp.isUsed}`);

    if (String(otp.code).trim() !== String(inputCode).trim()) {
      this.logger.warn(`[verifyAndUpdate] Code mismatch for ${identifier}: DB=${otp.code} vs Input=${inputCode}`);
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark as used
    otp.isUsed = true;
    await otp.save();

    this.logger.log(`[verifyAndUpdate] OTP validated for ${identifier} (type=${otp.type})`);

    // Update entity based on auto-detected OTP type
    if (otp.type === OtpType.EMAIL_VERIFICATION || otp.type === OtpType.PHONE_VERIFICATION) {
      const filter = options.email
        ? { email: options.email.toLowerCase() }
        : { phone: options.phone };
      const user = await this.userModel.findOne(filter);
      if (!user) throw new NotFoundException('User not found');
      user.isVerified = true;
      await user.save();
      this.logger.log(`[verifyAndUpdate] User ${identifier} marked as verified`);
      return { message: 'Account verified successfully' };
    }

    if (otp.type === OtpType.SELLER_VERIFICATION) {
      const filter = options.email
        ? { email: options.email.toLowerCase() }
        : { phone: options.phone };
      const seller = await this.sellerModel.findOne(filter);
      if (!seller) throw new NotFoundException('Seller not found');
      if (seller.isVerified) throw new BadRequestException('Seller is already verified');
      seller.isVerified = true;
      await seller.save();
      this.logger.log(`[verifyAndUpdate] Seller ${identifier} marked as verified`);
      return { message: 'Seller account verified successfully. You can now login.' };
    }

    if (otp.type === OtpType.ADMIN_VERIFICATION) {
      const filter = options.email
        ? { email: options.email.toLowerCase() }
        : { phone: options.phone };
      const admin = await this.adminModel.findOne(filter);
      if (!admin) throw new NotFoundException('Admin not found');
      if (admin.isVerified) throw new BadRequestException('Admin is already verified');
      admin.isVerified = true;
      await admin.save();
      this.logger.log(`[verifyAndUpdate] Admin ${identifier} marked as verified`);
      return { message: 'Admin account verified successfully. You can now login.' };
    }

    if (otp.type === OtpType.PASSWORD_RESET) {
      return { message: 'OTP verified. You may now reset your password.' };
    }

    throw new BadRequestException('Unknown OTP type');
  }

  /**
   * Validate an OTP and mark it as used. (used internally by resetPassword)
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
        this.logger.warn(`[validateOtp] No active OTP for ${identifier}`);
        throw new BadRequestException('Invalid or expired OTP');
      }

      if (String(otp.code).trim() !== String(inputCode).trim()) {
        this.logger.warn(`[validateOtp] Code mismatch for ${identifier}`);
        throw new BadRequestException('Invalid OTP code');
      }

      otp.isUsed = true;
      await otp.save();

      this.logger.log(`[validateOtp] Success for ${identifier} (${type})`);
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`[validateOtp] Error for ${identifier}: ${error.message}`);
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
