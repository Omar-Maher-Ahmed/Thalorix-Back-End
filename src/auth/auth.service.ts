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
import { Admin } from '../admin/schema/admin.schema';
import { Seller } from '../sellers/schema/seller.schema';
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
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) { }

  // ================= Login Website =================
  async websiteLogin(dto: WebsiteLoginDto) {
    let modelUsed: Model<any> = this.userModel;
    try {
      console.log('1. Starting login process for email:', dto.email);

      // Validate input
      if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
        throw new UnauthorizedException('Invalid email or password');
      }

      const email = dto.email.toLowerCase().trim();

      // 1. Find user in the three collections
      let user = await this.userModel
        .findOne({ email })
        .select('+password +isVerified +isBlocked +isDeleted');
      modelUsed = this.userModel;

      if (!user) {
        user = await this.adminModel
          .findOne({ email })
          .select('+password +isVerified +isBlocked +isDeleted') as any;
        modelUsed = this.adminModel;
      }

      if (!user) {
        user = await this.sellerModel
          .findOne({ email })
          .select('+password +isVerified +isBlocked +isDeleted +isActive') as any;
        modelUsed = this.sellerModel;
      }

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // 2. Check if account is blocked/deleted
      const isBlocked = user.isBlocked || (user.role === 'seller' && !(user as any).isActive);
      if (isBlocked || user.isDeleted) {
        throw new UnauthorizedException('Account is not available');
      }

      // 3. Verify password
      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // 4. Checking verification status from DB
      const dbStatus = await modelUsed
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
        role: user.role || (modelUsed === this.adminModel ? 'admin' : modelUsed === this.sellerModel ? 'seller' : 'user'),
        jti: crypto.randomBytes(16).toString('hex'),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '36500d',
        secret: process.env.JWT_SECRET,
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '36500d',
        secret: process.env.JWT_SECRET,
      });

      // 7. Update user document with tokens (Hashed)
      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      user.currentAccessToken = await bcrypt.hash(accessToken, 10);
      if ('lastLoginAt' in user) {
        (user as any).lastLoginAt = new Date();
      } else if ('lastLogin' in user) {
        (user as any).lastLogin = new Date();
      }
      if ('loginAttempts' in user) {
        (user as any).loginAttempts = 0;
      }

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
          role: payload.role,
        },
      };
    } catch (error) {
      if (dto.email && modelUsed !== this.sellerModel) {
        await modelUsed
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
    let modelUsed: Model<any> = this.userModel;
    try {
      if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
        throw new UnauthorizedException('Invalid email or password');
      }

      const email = dto.email.toLowerCase().trim();
      let user = await this.userModel.findOne({ email }).select('+password');

      if (!user) {
        user = await this.adminModel.findOne({ email }).select('+password') as any;
        modelUsed = this.adminModel;
      }

      if (!user) {
        user = await this.sellerModel.findOne({ email }).select('+password +isActive') as any;
        modelUsed = this.sellerModel;
      }

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (!user.isVerified) {
        throw new UnauthorizedException(
          'Account not verified. Please verify your OTP to login.',
        );
      }

      const isBlocked = user.isBlocked || (user.role === 'seller' && !(user as any).isActive);
      if (isBlocked || user.isDeleted) {
        throw new UnauthorizedException('Account is not available');
      }

      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role || (modelUsed === this.adminModel ? 'admin' : modelUsed === this.sellerModel ? 'seller' : 'user'),
        jti: crypto.randomBytes(16).toString('hex'),
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '36500d',
        secret: process.env.JWT_SECRET,
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '36500d',
        secret: process.env.JWT_SECRET,
      });

      user.refreshToken = await bcrypt.hash(refreshToken, 10);
      user.currentAccessToken = await bcrypt.hash(accessToken, 10);
      if ('lastLoginAt' in user) {
        (user as any).lastLoginAt = new Date();
      } else if ('lastLogin' in user) {
        (user as any).lastLogin = new Date();
      }
      if ('loginAttempts' in user) {
        (user as any).loginAttempts = 0;
      }

      await user.save();

      return {
        message: 'User logged in successfully',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: payload.role,
        },
      };
    } catch (error) {
      if (dto.email && modelUsed !== this.sellerModel) {
        await modelUsed
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

      let user;
      let modelUsed: Model<any> = this.userModel;

      if (payload.role === 'admin') {
        user = await this.adminModel
          .findById(payload.sub)
          .select('+refreshToken +currentAccessToken')
          .exec();
        modelUsed = this.adminModel;
      } else if (payload.role === 'seller') {
        user = await this.sellerModel
          .findById(payload.sub)
          .select('+refreshToken +currentAccessToken')
          .exec();
        modelUsed = this.sellerModel;
      } else {
        user = await this.userModel
          .findById(payload.sub)
          .select('+refreshToken +currentAccessToken')
          .exec();
        modelUsed = this.userModel;
      }

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
        role: user.role || (modelUsed === this.adminModel ? 'admin' : modelUsed === this.sellerModel ? 'seller' : 'user'),
        jti: crypto.randomBytes(16).toString('hex'),
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '36500d',
        secret: process.env.JWT_SECRET,
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '36500d',
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
    const userUpdate = await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          currentAccessToken: 1,
          refreshToken: 1,
        },
      },
    );
    if (userUpdate.matchedCount === 0) {
      const adminUpdate = await this.adminModel.updateOne(
        { _id: userId },
        {
          $unset: {
            currentAccessToken: 1,
            refreshToken: 1,
          },
        },
      );
      if (adminUpdate.matchedCount === 0) {
        await this.sellerModel.updateOne(
          { _id: userId },
          {
            $unset: {
              currentAccessToken: 1,
              refreshToken: 1,
            },
          },
        );
      }
    }
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
      phone: dto.phone,
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
      phone: dto.phone,
      name: dto.name,
    });

    return { message: 'User registered successfully', otp };
  }

  // ================= Forgot Password =================
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    let user = await this.userModel.findOne({
      $or: [
        { email: forgotPasswordDto.email },
        { phone: forgotPasswordDto.phone },
      ],
    });

    if (!user) {
      user = await this.adminModel.findOne({
        $or: [
          { email: forgotPasswordDto.email },
          { phone: forgotPasswordDto.phone },
        ],
      }) as any;
    }

    if (!user) {
      user = await this.sellerModel.findOne({
        $or: [
          { email: forgotPasswordDto.email },
          { phone: forgotPasswordDto.phone },
        ],
      }) as any;
    }

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
    let user = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });
    let modelUsed: Model<any> = this.userModel;

    if (!user) {
      user = await this.adminModel.findOne({
        $or: [{ email: dto.email }, { phone: dto.phone }],
      }) as any;
      modelUsed = this.adminModel;
    }

    if (!user) {
      user = await this.sellerModel.findOne({
        $or: [{ email: dto.email }, { phone: dto.phone }],
      }) as any;
      modelUsed = this.sellerModel;
    }

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
