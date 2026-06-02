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
import { UpdateSellerDto } from './dto/update-seller.dto';
import { QuerySellerDto } from './dto/query-seller.dto';
import { VerifyOtpDto } from '../otp/dto/otp.dto';
import { OtpService } from '../otp/otp.service';
import { OtpType } from '../otp/schema/otp.schema';

@Injectable()
export class SellersService {
  constructor(
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<SellerDocument>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) { }

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

  // ================= Login Seller =================
  async loginSeller(dto: LoginSellerDto) {
    try {
      if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
        throw new UnauthorizedException('Invalid email or password');
      }

      const seller = await this.sellerModel
        .findOne({ email: dto.email.toLowerCase().trim() })
        .select('+password +currentAccessToken +refreshToken');

      if (!seller) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!seller.isActive) {
        throw new UnauthorizedException('Seller account is deactivated');
      }

      const isMatch = await bcrypt.compare(dto.password, seller.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
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
    } catch (error) {
      throw error;
    }
  }

  // ================= Refresh Seller Access Token =================
  async refreshSellerToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      const seller = await this.sellerModel
        .findById(payload.sub)
        .select('+refreshToken +currentAccessToken');

      if (!seller || !seller.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, seller.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (!seller.isActive) {
        throw new UnauthorizedException('Seller account is deactivated');
      }

      const newPayload = {
        sub: seller._id.toString(),
        email: seller.email,
        role: seller.role,
        jti: crypto.randomBytes(16).toString('hex'),
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET,
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
        secret: process.env.JWT_SECRET,
      });

      seller.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      seller.currentAccessToken = await bcrypt.hash(newAccessToken, 10);
      await seller.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ================= Logout Seller =================
  async logoutSeller(sellerId: string) {
    await this.sellerModel.updateOne(
      { _id: sellerId },
      { $unset: { currentAccessToken: 1, refreshToken: 1 } },
    );
    return { message: 'Logged out successfully' };
  }

  // ================= Get All Sellers =================
  async getSellers(query: QuerySellerDto) {
    const { limit = 10, page = 1, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
      ];
    }

    const [sellers, total] = await Promise.all([
      this.sellerModel
        .find(filter)
        .select('-password -currentAccessToken -refreshToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      this.sellerModel.countDocuments(filter),
    ]);

    return {
      data: sellers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ================= Get Seller By ID =================
  async getSellerById(id: string) {
    const seller = await this.sellerModel
      .findById(id)
      .select('-password -currentAccessToken -refreshToken')
      .lean();

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return seller;
  }

  // ================= Update Seller =================
  async updateSeller(id: string, dto: UpdateSellerDto) {
    // Check phone uniqueness if being changed
    if (dto.phone) {
      const existing = await this.sellerModel.findOne({
        phone: dto.phone,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException('Phone number is already in use by another seller');
      }
    }

    const updated = await this.sellerModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .select('-password -currentAccessToken -refreshToken')
      .lean();

    if (!updated) {
      throw new NotFoundException('Seller not found');
    }

    return { message: 'Seller updated successfully', seller: updated };
  }

  // ================= Delete Seller =================
  async deleteSeller(id: string) {
    const deleted = await this.sellerModel.findByIdAndDelete(id).lean();

    if (!deleted) {
      throw new NotFoundException('Seller not found');
    }

    return { message: 'Seller deleted successfully' };
  }
}
