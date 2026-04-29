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
import { OtpService } from '../otp/otp.service';
import { OtpType } from '../otp/schema/otp.schema';

@Injectable()
export class SellersService {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<SellerDocument>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}



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
        throw new ConflictException(
          'Seller with this phone number already exists',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newSeller = await this.sellerModel.create({
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

    await this.otpService.createOtp(OtpType.SELLER_VERIFICATION, {
      userId: newSeller._id,
      email: dto.email,
      name: dto.name,
    });

    return {
      message: 'Seller registered successfully. Please verify your OTP.',
    };
  }

  // ================= Verify OTP =================
  async verifyOtp(dto: VerifyOtpDto) {
    const seller = await this.sellerModel.findOne({ email: dto.email });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (seller.isVerified) {
      throw new BadRequestException('Seller is already verified');
    }

    await this.otpService.validateOtp(dto.code, OtpType.SELLER_VERIFICATION, {
      userId: seller._id,
      email: dto.email,
    });

    seller.isVerified = true;
    await seller.save();

    return { message: 'Seller verified successfully. You can now login.' };
  }

  // ================= Resend OTP =================
  async resendOtp(dto: ResendOtpDto) {
    const seller = await this.sellerModel.findOne({ email: dto.email });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (seller.isVerified) {
      throw new BadRequestException('Seller is already verified');
    }

    await this.otpService.createOtp(OtpType.SELLER_VERIFICATION, {
      userId: seller._id,
      email: dto.email,
      name: seller.name,
    });

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
      throw new UnauthorizedException(
        'Seller account is not verified. Please verify your OTP first.',
      );
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
