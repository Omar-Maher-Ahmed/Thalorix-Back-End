import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Seller, SellerDocument } from './schema/seller.schema';
import { CreateSellerDto } from './dto/create-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { VerifyOtpDto, ResendOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class SellersService {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<SellerDocument>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generates a 6 digit numeric OTP
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates and stores OTP for a seller, setting expiration to 10 minutes
   */
  private async generateOtpForSeller(seller: SellerDocument): Promise<string> {
    const otp = this.generateOtpCode();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    seller.otp = await bcrypt.hash(otp, 10);
    seller.otpExpiresAt = otpExpiresAt;
    await seller.save();

    // Note: In a real system, you would send this OTP via SMS or Email here.
    // We log it for development visibility.
    console.log(`[DEV ONLY] OTP for seller ${seller.email}: ${otp}`);
    return otp;
  }

  // ================= Register Seller =================
  async registerSeller(dto: CreateSellerDto) {
    const existingSeller = await this.sellerModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingSeller) {
      if (existingSeller.email === dto.email) {
        throw new ConflictException('Seller with this email already exists');
      }
      if (existingSeller.phone === dto.phone) {
        throw new ConflictException('Seller with this phone number already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newSeller = new this.sellerModel({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      storeName: dto.storeName,
      storeDescription: dto.storeDescription,
      logo: dto.logo,
      address: dto.address,
      role: 'seller',
    });

    const otp = await this.generateOtpForSeller(newSeller);

    return {
      message: 'Seller registered successfully. Please verify your OTP.',
    };
  }

  // ================= Verify OTP =================
  async verifyOtp(dto: VerifyOtpDto) {
    const seller = await this.sellerModel
      .findOne({ email: dto.email })
      .select('+otp +otpExpiresAt');

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (seller.isVerified) {
      throw new BadRequestException('Seller is already verified');
    }

    if (!seller.otp || !seller.otpExpiresAt) {
      throw new BadRequestException('No OTP found for this seller. Please request a new one.');
    }

    if (new Date() > seller.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    const isMatch = await bcrypt.compare(dto.code, seller.otp);
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP code');
    }

    seller.isVerified = true;
    seller.otp = undefined;
    seller.otpExpiresAt = undefined;
    await seller.save();

    return { message: 'Seller verified successfully. You can now login.' };
  }

  // ================= Resend OTP =================
  async resendOtp(dto: ResendOtpDto) {
    const seller = await this.sellerModel.findOne({ email: dto.email }).select('+otp +otpExpiresAt');

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (seller.isVerified) {
      throw new BadRequestException('Seller is already verified');
    }

    const otp = await this.generateOtpForSeller(seller);

    return {
      message: 'A new OTP has been sent to your email.',
    };
  }

  // ================= Login Seller =================
  async loginSeller(dto: LoginSellerDto) {
    const seller = await this.sellerModel
      .findOne({ email: dto.email })
      .select('+password +currentAccessToken +refreshToken');

    if (!seller) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!seller.isActive) {
      throw new UnauthorizedException('Seller account is deactivated');
    }

    const isMatch = await bcrypt.compare(dto.password, seller.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!seller.isVerified) {
      throw new UnauthorizedException('Seller account is not verified. Please verify your OTP first.');
    }

    const payload = {
      sub: seller._id.toString(),
      email: seller.email,
      role: seller.role,
      jti: crypto.randomBytes(16).toString('hex'),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET,
    });

    seller.refreshToken = await bcrypt.hash(refreshToken, 10);
    seller.currentAccessToken = await bcrypt.hash(accessToken, 10);
    seller.lastLogin = new Date();
    await seller.save();

    return {
      message: 'Seller logged in successfully',
      accessToken,
      refreshToken,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        storeName: seller.storeName,
        role: seller.role,
      },
    };
  }
}
