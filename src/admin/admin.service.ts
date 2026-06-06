import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ChangePasswordDto } from '../users/dto/change-password.dto';

import { Admin } from '../admin/schema/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import * as bcrypt from 'bcrypt';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { OtpService } from '../otp/otp.service';
import { OtpType } from '../otp/schema/otp.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) { }

  // ================= Find All =================
  async findAll(): Promise<Admin[]> {
    return this.adminModel.find().select('-password').lean();
  }

  // ================= Find One =================
  async findById(id: string): Promise<Admin | null> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Admin not found');
    }
    const user = await this.adminModel.findById(id).select('-password').lean();

    if (!user) throw new NotFoundException('Admin not found');
    return user as any;
  }

  // ================= Update =================
  async update(id: string, dto: UpdateAdminDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Admin ID format');
    }
    const updateData = { ...dto } as any;

    if (dto.avatar && !dto.avatarUrl) {
      updateData.avatarUrl = dto.avatar;
    }
    const user = await this.adminModel.findByIdAndUpdate(id, { $set: updateData }, {
      returnDocument: 'after',
    }).select('-password').lean();

    if (!user) throw new NotFoundException('User not found');

    return { message: 'User updated successfully', user };
  }
  // ================= Remove =================
  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Admin ID format');
    }
    const user = await this.adminModel.findByIdAndDelete(id);

    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  // ================= Create Admin =================
  async createAdmin(dto: CreateAdminDto) {
    const existingUser = await this.adminModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingUser) {
      throw new ConflictException('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newAdmin = await this.adminModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: 'admin',
      isVerified: false,
    });

    await this.otpService.createOtp(OtpType.ADMIN_VERIFICATION, {
      userId: newAdmin._id,
      email: dto.email,
      phone: dto.phone,
      name: dto.name,
    });

    return {
      message: 'Admin created successfully. Please verify your OTP to activate the account.',
    };
  }

  // ================= Get My Profile =================
  async getMyProfile(id: string) {
    const user = await this.adminModel.findById(id).select('-password').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ================= login =================
  async Login(dto: LoginAdminDto) {
    try {
      if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
        throw new UnauthorizedException('Invalid credentials');
      }

      const email = dto.email.toLowerCase().trim();
      const user = await this.adminModel.findOne({ email }).select('+password');

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException(
          'Account not verified. Please verify your OTP to login.',
        );
      }

      if (user.isBlocked || user.isDeleted) {
        throw new UnauthorizedException('Account is not available');
      }

      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
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

      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      user.currentAccessToken = await bcrypt.hash(accessToken, 10);
      user.lastLoginAt = new Date();
      user.loginAttempts = 0;

      await user.save();

      return {
        message: 'User logged in successfully',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (dto.email) {
        await this.adminModel
          .updateOne(
            { email: dto.email.toLowerCase().trim() },
            { $inc: { loginAttempts: 1 } },
          )
          .catch(() => null);
      }
      throw error;
    }
  }

  // ================= Change Password =================
  async changePassword(id: string, dto: ChangePasswordDto, requesterId?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Admin ID format');
    }

    if (requesterId && requesterId.toString() !== id.toString()) {
      throw new UnauthorizedException('You can only change your own password');
    }

    const admin = await this.adminModel.findOne({ _id: id, isDeleted: { $ne: true } }).select('+password');
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (!admin.password) {
      throw new BadRequestException('Admin does not have a password set');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, admin.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    const payload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
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

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const hashedCurrentAccessToken = await bcrypt.hash(accessToken, 10);

    await this.adminModel.updateOne(
      { _id: id },
      { 
        $set: {
          password: hashedPassword,
          currentAccessToken: hashedCurrentAccessToken,
          refreshToken: hashedRefreshToken,
        },
        $inc: { tokenVersion: 1 }
      }
    );

    return { 
      message: 'Password changed successfully',
      accessToken,
      refreshToken
    };
  }
}

