import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';
import {
  WebsiteSignUpDto,
  MobileSignUpDto,
  WebsiteLoginDto,
  MobileLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../auth/dto';
import { OtpService } from '../otp/otp.service';
import { OtpType } from '../otp/schema/otp.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}

  // ================= Login Website =================
  async websiteLogin(dto: WebsiteLoginDto) {
    try {
      console.log('1. Starting login process for email:', dto.email);

      // Validate input
      if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
        throw new UnauthorizedException('Invalid credentials');
      }

      const email = dto.email.toLowerCase().trim();

      // 1. Find user with password and status fields
      const user = await this.userModel
        .findOne({ email })
        .select('+password +isVerified +isBlocked +isDeleted');

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 2. Check if account is blocked/deleted
      if (user.isBlocked || user.isDeleted) {
        throw new UnauthorizedException('Account is not available');
      }

      // 3. Verify password
      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // 4. Checking verification status from DB
      const dbStatus = await this.userModel
        .findById(user._id)
        .select('isVerified')
        .lean();

      if (!dbStatus || !dbStatus.isVerified) {
        throw new UnauthorizedException(
          'Account not verified. Please verify your OTP to login.',
        );
      }

      // 5. Update Memory Object
      user.isVerified = true;

      // 6. Generating tokens...
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

      // 7. Update user document with tokens (Hashed)
      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      user.currentAccessToken = await bcrypt.hash(accessToken, 10);
      user.lastLoginAt = new Date();
      user.loginAttempts = 0;

      // 8. Save changes
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
        await this.userModel
          .updateOne(
            { email: dto.email.toLowerCase().trim() },
            { $inc: { loginAttempts: 1 } },
          )
          .catch(() => null);
      }
      throw error;
    }
  }

  // ================= Login Mobile =================
  async mobileLogin(dto: MobileLoginDto) {
    try {
      if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
        throw new UnauthorizedException('Invalid credentials');
      }

      const email = dto.email.toLowerCase().trim();
      const user = await this.userModel.findOne({ email }).select('+password');

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
        await this.userModel
          .updateOne(
            { email: dto.email.toLowerCase().trim() },
            { $inc: { loginAttempts: 1 } },
          )
          .catch(() => null);
      }
      throw error;
    }
  }

  // ================= Refresh Access Token =================
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.userModel
        .findById(payload.sub)
        .select('+refreshToken +currentAccessToken')
        .exec();

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const newPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
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
      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      user.currentAccessToken = await bcrypt.hash(newAccessToken, 10);
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ================= Logout =================
  async logout(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          currentAccessToken: 1,
          refreshToken: 1,
        },
      },
    );
    return { message: 'Logged out successfully' };
  }

  // ================= Utils =================
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // ================= Register Website =================
  async websiteRegister(dto: WebsiteSignUpDto) {
    const dangerousPatterns = [
      /<[^>]*>/,
      /&lt;.*&gt;/,
      /&#x?[0-9A-F]+;/i,
      /on\w+=/i,
      /javascript:/i,
      /alert\s*\(/i,
      /prompt\s*\(/i,
      /confirm\s*\(/i,
      /eval\s*\(/i,
      /function\s*\(/i,
      /new\s+Function/i,
      /document\./i,
      /window\./i,
      /location\./i,
      /cookie/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(dto.name)) {
        throw new BadRequestException('Name cannot contain HTML tags');
      }
    }
    const userData = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (userData) {
      if (userData.email === dto.email) {
        throw new ConflictException('Email already exists');
      }
      if (userData.phone === dto.phone) {
        throw new ConflictException('Phone already exists');
      }
    }

    const newUser = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: 'user',
    });

    const otp = await this.otpService.createOtp(OtpType.EMAIL_VERIFICATION, {
      userId: newUser._id,
      email: dto.email,
      name: dto.name,
    });

    return { message: 'User registered successfully', otp };
  }

  // ================= Register Mobile =================
  async mobileRegister(dto: MobileSignUpDto) {
    const dangerousPatterns = [
      /<[^>]*>/,
      /&lt;.*&gt;/,
      /&#x?[0-9A-F]+;/i,
      /on\w+=/i,
      /javascript:/i,
      /alert\s*\(/i,
      /prompt\s*\(/i,
      /confirm\s*\(/i,
      /eval\s*\(/i,
      /function\s*\(/i,
      /new\s+Function/i,
      /document\./i,
      /window\./i,
      /location\./i,
      /cookie/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(dto.name)) {
        throw new BadRequestException('Name cannot contain HTML tags');
      }
    }
    const userData = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (userData) {
      if (userData.email === dto.email) {
        throw new ConflictException('Email already exists');
      }
      if (userData.phone === dto.phone) {
        throw new ConflictException('Phone already exists');
      }
    }

    const newUser = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: 'user',
    });

    const otp = await this.otpService.createOtp(OtpType.EMAIL_VERIFICATION, {
      userId: newUser._id,
      email: dto.email,
      name: dto.name,
    });

    return { message: 'User registered successfully', otp };
  }

  // ================= Forgot Password =================
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({
      $or: [
        { email: forgotPasswordDto.email },
        { phone: forgotPasswordDto.phone },
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpService.createOtp(OtpType.PASSWORD_RESET, {
      userId: user._id,
      email: forgotPasswordDto.email,
      phone: forgotPasswordDto.phone,
      name: user.name,
    });

    return { message: 'Password reset OTP sent' };
  }

  // ================= Reset Password =================
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.otpService.validateOtp(dto.code, OtpType.PASSWORD_RESET, {
      userId: user._id,
      email: dto.email,
      phone: dto.phone,
    });

    user.password = await this.hashPassword(dto.newPassword);

    // await this.otpService.expireAllOtps(OtpType.PASSWORD_RESET, {
    //   userId: user._id,
    // });

    await user.save();

    return { message: 'Password reset successfully' };
  }
}
