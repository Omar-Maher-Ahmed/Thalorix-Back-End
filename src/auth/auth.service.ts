import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    NotFoundException
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
    VerifyOtpDto,
    ResetPasswordDto,
} from '../auth/dto';
import { MailService } from '../services/mail/mail.service';
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
        private readonly mailService: MailService,
        private readonly otpService: OtpService,
    ) { }

    // ================= Login Website =================
    async websiteLogin(dto: WebsiteLoginDto) {
        try {
            console.log('1. Starting login process for email:', dto.email);

            // Validate input
            if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
                console.log('2. Invalid input types');
                throw new UnauthorizedException('Invalid credentials');
            }

            const email = dto.email.toLowerCase().trim();
            console.log('3. Normalized email:', email);

            // Find user with password field
            console.log('4. Looking for user in database...');
            const user = await this.userModel
                .findOne({ email })
                .select('+password');

            console.log('5. User found:', user ? 'Yes' : 'No');

            if (!user) {
                console.log('6. User not found');
                throw new UnauthorizedException('Invalid credentials');
            }

            // Verify password
            console.log('7. Comparing passwords...');
            const isMatch = await bcrypt.compare(dto.password, user.password);
            console.log('8. Password match:', isMatch);

            if (!isMatch) {
                console.log('9. Password mismatch');
                throw new UnauthorizedException('Invalid credentials');
            }

            // Check if account is verified
            console.log('9.5 Checking verification status...');
            if (!user.isVerified) {
                console.log('9.6 Account not verified');
                throw new UnauthorizedException('Account not verified. Please verify your OTP to login.');
            }

            // Check if account is blocked/deleted
            console.log('10. Checking account status - Blocked:', user.isBlocked, 'Deleted:', user.isDeleted);
            if (user.isBlocked || user.isDeleted) {
                console.log('11. Account blocked or deleted');
                throw new UnauthorizedException('Account is not available');
            }

            console.log('12. Generating tokens...');
            // Create JWT payload
            const payload = {
                sub: user._id.toString(),
                email: user.email,
                role: user.role,
                jti: crypto.randomBytes(16).toString('hex')
            };

            // Generate tokens
            const accessToken = this.jwtService.sign(payload, {
                expiresIn: '15m',
                secret: process.env.JWT_ACCESS_SECRET || 'access-secret'
            });

            const refreshToken = this.jwtService.sign(payload, {
                expiresIn: '7d',
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'
            });

            console.log('13. Tokens generated successfully');

            // Hash and store refresh token
            console.log('14. Hashing refresh token...');
            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

            // ✅ التعديل هنا: خزن الـ accessToken كمان
            user.refreshToken = hashedRefreshToken;
            user.currentAccessToken = accessToken; // <-- ضيف السطر ده
            user.lastLoginAt = new Date();
            user.loginAttempts = 0;

            console.log('15. Saving user with tokens...');
            console.log('   - Refresh token saved:', !!hashedRefreshToken);
            console.log('   - Access token saved:', !!accessToken);
            await user.save();
            console.log('16. User saved successfully');

            // Return success response
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
            // Print FULL error details
            console.log('========== ERROR DETAILS ==========');
            console.log('Error name:', error.name);
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            console.log('===================================');

            // Update login attempts
            if (dto.email) {
                try {
                    await this.userModel.updateOne(
                        { email: dto.email.toLowerCase().trim() },
                        { $inc: { loginAttempts: 1 } }
                    );
                    console.log('Login attempts updated for:', dto.email);
                } catch (updateError) {
                    console.log('Failed to update login attempts:', updateError.message);
                }
            }

            // Re-throw the error
            throw error;
        }
    }
    // ================= Login Mobile =================
    async mobileLogin(dto: MobileLoginDto) {
        try {
            console.log('1. Starting login process for email:', dto.email);

            // Validate input
            if (typeof dto.email !== 'string' || typeof dto.password !== 'string') {
                console.log('2. Invalid input types');
                throw new UnauthorizedException('Invalid credentials');
            }

            const email = dto.email.toLowerCase().trim();
            console.log('3. Normalized email:', email);

            // Find user with password field
            console.log('4. Looking for user in database...');
            const user = await this.userModel
                .findOne({ email })
                .select('+password');

            console.log('5. User found:', user ? 'Yes' : 'No');

            if (!user) {
                console.log('6. User not found');
                throw new UnauthorizedException('Invalid credentials');
            }

            // Verify password
            console.log('7. Comparing passwords...');
            const isMatch = await bcrypt.compare(dto.password, user.password);
            console.log('8. Password match:', isMatch);

            if (!isMatch) {
                console.log('9. Password mismatch');
                throw new UnauthorizedException('Invalid credentials');
            }

            // Check if account is verified
            console.log('9.5 Checking verification status...');
            if (!user.isVerified) {
                console.log('9.6 Account not verified');
                throw new UnauthorizedException('Account not verified. Please verify your OTP to login.');
            }

            // Check if account is blocked/deleted
            console.log('10. Checking account status - Blocked:', user.isBlocked, 'Deleted:', user.isDeleted);
            if (user.isBlocked || user.isDeleted) {
                console.log('11. Account blocked or deleted');
                throw new UnauthorizedException('Account is not available');
            }

            console.log('12. Generating tokens...');
            // Create JWT payload
            const payload = {
                sub: user._id.toString(),
                email: user.email,
                role: user.role,
                jti: crypto.randomBytes(16).toString('hex')
            };

            // Generate tokens
            const accessToken = this.jwtService.sign(payload, {
                expiresIn: '15m',
                secret: process.env.JWT_ACCESS_SECRET || 'access-secret'
            });

            const refreshToken = this.jwtService.sign(payload, {
                expiresIn: '7d',
                secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret'
            });

            console.log('13. Tokens generated successfully');

            // Hash and store refresh token
            console.log('14. Hashing refresh token...');
            const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

            // ✅ التعديل هنا: خزن الـ accessToken كمان
            user.refreshToken = hashedRefreshToken;
            user.currentAccessToken = accessToken; // <-- ضيف السطر ده
            user.lastLoginAt = new Date();
            user.loginAttempts = 0;

            console.log('15. Saving user with tokens...');
            console.log('   - Refresh token saved:', !!hashedRefreshToken);
            console.log('   - Access token saved:', !!accessToken);
            await user.save();
            console.log('16. User saved successfully');

            // Return success response
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
            // Print FULL error details
            console.log('========== ERROR DETAILS ==========');
            console.log('Error name:', error.name);
            console.log('Error message:', error.message);
            console.log('Error stack:', error.stack);
            console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            console.log('===================================');

            // Update login attempts
            if (dto.email) {
                try {
                    await this.userModel.updateOne(
                        { email: dto.email.toLowerCase().trim() },
                        { $inc: { loginAttempts: 1 } }
                    );
                    console.log('Login attempts updated for:', dto.email);
                } catch (updateError) {
                    console.log('Failed to update login attempts:', updateError.message);
                }
            }

            // Re-throw the error
            throw error;
        }
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
    
    async logout(userId: string) {
        await this.userModel.updateOne(
            { _id: userId },
            {
                $unset: {
                    currentAccessToken: 1, // امسح access token
                    refreshToken: 1        // امسح refresh token كمان
                }
            }
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

        const newUser = await this.userModel.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            password: await this.hashPassword(dto.password),
            role: 'user',
        });

        await this.otpService.createOtp(OtpType.EMAIL_VERIFICATION, {
            userId: newUser._id,
            email: dto.email,
            name: dto.name,
        });


        return { message: 'User registered successfully' };
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

        const newUser = await this.userModel.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            password: await this.hashPassword(dto.password),
            role: 'user',
        });

        // Use PHONE_VERIFICATION if SMS is primarily used, but we use OtpType
        await this.otpService.createOtp(OtpType.PHONE_VERIFICATION, {
            userId: newUser._id,
            phone: dto.phone,
            name: dto.name,
        });


        return { message: 'User registered successfully' };
    }

    // ================= Forgot Password =================
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const user = await this.userModel.findOne({
            $or: [{ email: forgotPasswordDto.email }, { phone: forgotPasswordDto.phone }]
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // [OTP Integration]: بدلاً من إنشاء توكن وحفظه في حساب المستخدم وتعديل قاعدة البيانات يدوياً
        // بقا النظام كله رايح لـ OtpService وهي بتدير إنشاء الكود وتشفيره وإرساله
        await this.otpService.createOtp(OtpType.PASSWORD_RESET, {
            userId: user._id,
            email: forgotPasswordDto.email,
            phone: forgotPasswordDto.phone,
            name: user.name,
        });

        return { message: 'Password reset OTP sent' };
    }

    // ================= Verify OTP =================
    // [OTP Integration]: دي دالة جديدة المخصصة لاستقبال طلب التفعيل وتمرير الكود للـ OtpService يتأكد منه
    async verifyOtp(dto: VerifyOtpDto) {
        const user = await this.userModel.findOne({
            $or: [{ email: dto.email }, { phone: dto.phone }]
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // [OTP Integration]: بنحدد نوع الكود اللي هيدور فيه على أساس هل المستخدم باعت إيميل ولا رقم تليفون
        const type = dto.email ? OtpType.EMAIL_VERIFICATION : OtpType.PHONE_VERIFICATION;
        
        // [OTP Integration]: هنا الـ validateOtp بيقوم بكل الشغل ورا الكواليس (قفل الكود وتجنب اختراقه وتأكيده)
        await this.otpService.validateOtp(dto.code, type, {
            userId: user._id,
            email: dto.email,
            phone: dto.phone,
        });

        // [OTP Integration]: الدالة لو ماعملتش throw لمشكلة، ده معناه التوثيق ناجح وبنعدل حالة المستخدم
        user.isVerified = true;
        await user.save();

        return { message: 'Account verified successfully' };
    }

    // ================= Reset Password =================
    // [OTP Integration]: دي الدالة اللي بتخلص عملية الاستعادة. بتستقبل التوكن مع الباسورد الجديد وتأكده
    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.userModel.findOne({
            $or: [{ email: dto.email }, { phone: dto.phone }]
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // [OTP Integration]: التأكد إن الكود اللي اتبعت مخصص ومكتوب صح ومسجل بانه يطابق المستخدم ده
        await this.otpService.validateOtp(dto.code, OtpType.PASSWORD_RESET, {
            userId: user._id,
            email: dto.email,
            phone: dto.phone,
        });

        // [OTP Integration]: تشفير وتعديل الباسورد الجديد وتحديثه
        user.password = await this.hashPassword(dto.newPassword);
        
        // Optional: cancel all other active tokens
        // [OTP Integration]: كحركة أمان إضافية، بنحطلها أمر بأنها تمسح كل أكواد الاسترداد اللي لسه مفتوحة للحساب ده
        await this.otpService.expireAllOtps(OtpType.PASSWORD_RESET, { userId: user._id });

        await user.save();

        return { message: 'Password reset successfully' };
    }

}
