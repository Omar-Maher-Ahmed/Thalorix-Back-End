import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';
import {
    WebsiteSignUpDto,
    MobileSignUpDto,
    WebsiteLoginDto,
    MobileLoginDto,
} from '../auth/dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name)
        private readonly userModel: Model<User>,
        private readonly jwtService: JwtService,
    ) { }

    // ================= Login Website =================
    async websiteLogin(dto: WebsiteLoginDto) {
        try {
            if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
                throw new UnauthorizedException('Invalid credentials');
            }

            const cleanEmail = dto.email.toLowerCase().trim();

            const user = await this.userModel
                .findOne({ email: cleanEmail })
                .select('+password');

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const isMatch = await bcrypt.compare(dto.password, user.password);
            if (!isMatch) {
                throw new UnauthorizedException('Invalid credentials');
            }

            if (user.isBlocked || user.isDeleted) {
                throw new UnauthorizedException('Account is not available');
            }

            const payload = {
                sub: user._id.toString(),
                email: user.email,
                role: user.role,
                jti: crypto.randomBytes(16).toString('hex')
            };

            const accessToken = this.jwtService.sign(payload, {
                expiresIn: '15m',
                secret: process.env.JWT_ACCESS_SECRET || 'access-secret'
            });

            const refreshToken = this.jwtService.sign(payload, {
                expiresIn: '7d',
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'
            });

            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

            user.refreshToken = hashedRefreshToken;
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
                await this.userModel.updateOne(
                    { email: dto.email.toLowerCase().trim() },
                    { $inc: { loginAttempts: 1 } }
                );
            }

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            console.error('Login error:', error.message);
            throw new UnauthorizedException('Login failed');
        }
    }

    // ================= Login Mobile =================
    async mobileLogin(dto: MobileLoginDto) {
        const user = await this.userModel
            .findOne({ email: dto.email })
            .select('+password');

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: '7d',
        });

        // حفظ refresh token
        user.refreshToken = refreshToken;
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
    }

    // ================= Refresh Access Token =================
    async refreshAccessToken(refreshToken: string) {
        try {
            // التحقق من صحة الـ refresh token
            const payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET
            });

            // البحث عن المستخدم
            const user = await this.userModel.findById(payload.sub);

            // التحقق من وجود المستخدم وتطابق التوكن
            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // مقارنة التوكن (لأنه متخزن مشفر)
            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // إنشاء payload جديد
            const newPayload = {
                sub: user._id.toString(),
                email: user.email,
                role: user.role,
                jti: crypto.randomBytes(16).toString('hex')
            };

            // إنشاء access token جديد
            const newAccessToken = this.jwtService.sign(newPayload, {
                expiresIn: '15m',
                secret: process.env.JWT_ACCESS_SECRET
            });

            // (اختياري) تجديد refresh token برضه
            const newRefreshToken = this.jwtService.sign(newPayload, {
                expiresIn: '7d',
                secret: process.env.JWT_REFRESH_SECRET
            });

            // تحديث refresh token في الداتابيز
            const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
            user.refreshToken = hashedNewRefreshToken;
            await user.save();

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken // لو عاوز تجدد refresh token برضه
            };

        } catch (error) {
            console.error('Refresh token error:', error.message);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    // ================= Logout =================
    async logout(userId: string) {
        try {
            await this.userModel.updateOne(
                { _id: userId },
                { $unset: { refreshToken: 1 } }
            );

            return { message: 'Logged out successfully' };
        } catch (error) {
            console.error('Logout error:', error.message);
            throw new UnauthorizedException('Logout failed');
        }
    }

    // ================= Utils =================
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    // ================= Register Website =================
    async websiteRegister(dto: WebsiteSignUpDto) {
        // فحص إضافي قبل الحفظ في قاعدة البيانات
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
            /cookie/i
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

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = await this.userModel.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            password: await this.hashPassword(dto.password),
            role: 'user',
            verificationToken,
            verificationTokenExpires,
        });


        return { message: 'User registered successfully' };
    }

    // ================= Register Mobile =================
    async mobileRegister(dto: MobileSignUpDto) {
        // فحص إضافي قبل الحفظ في قاعدة البيانات
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
            /cookie/i
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

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const newUser = await this.userModel.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            password: await this.hashPassword(dto.password),
            role: 'user',
            verificationToken,
            verificationTokenExpires,
        });


        return { message: 'User registered successfully' };
    }


}
