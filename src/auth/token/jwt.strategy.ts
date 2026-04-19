import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schema/user.schema';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      passReqToCallback: true, // ✅ عشان نقدر نجيب الـ raw token من الـ request
    });
  }

  // async validate(req: Request, payload: any) {
  //   console.log('\n' + '='.repeat(60));
  //   console.log('🔥 JWT Payload:', payload);

  //   // ✅ استخراج الـ raw token من الـ request
  //   const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  //   if (!rawToken) {
  //     throw new UnauthorizedException('No token provided');
  //   }

  //   // ✅ جيب الـ user مع الـ currentAccessToken المخزن
  //   const user = await this.userModel
  //     .findById(payload.sub)
  //     .select('+currentAccessToken +refreshToken')
  //     .exec();

  //   console.log(
  //     '📊 User from DB:',
  //     user
  //       ? {
  //           id: user._id,
  //           email: user.email,
  //           hasAccessToken: !!user.currentAccessToken,
  //           hasRefreshToken: !!user.refreshToken,
  //         }
  //       : '❌ NOT FOUND',
  //   );

  //   if (!user) {
  //     console.log('❌ User not found in database!');
  //     throw new UnauthorizedException('User not found');
  //   }

  //   if (!user.currentAccessToken) {
  //     console.log('❌ No active session found in database!');
  //     throw new UnauthorizedException('No active session, please login again');
  //   }

  //   if (user.isBlocked || user.isDeleted) {
  //     console.log('❌ User is blocked or deleted');
  //     throw new UnauthorizedException('Account not available');
  //   }

  //   // ✅ مقارنة الـ raw token بالـ hashed token المخزن في DB
  //   const isTokenValid = await bcrypt.compare(
  //     rawToken,
  //     user.currentAccessToken,
  //   );
  //   if (!isTokenValid) {
  //     console.log('❌ Token mismatch! Session may have been invalidated.');
  //     throw new UnauthorizedException('Session expired, please login again');
  //   }

  //   console.log('✅ User validated:', user.email);
  //   console.log('='.repeat(60) + '\n');

  //   return {
  //     userId: user._id,
  //     email: user.email,
  //     role: user.role,
  //     currentAccessToken: user.currentAccessToken, // هيجي ولا لا؟
  //   };
  // }
  async validate(req: Request, payload: any) {
    // استخراج الـ Token من الهيدر مباشرة
    const authHeader = req.headers.authorization;
    const rawToken = authHeader ? authHeader.split(' ')[1] : null;

    if (!rawToken) {
      throw new UnauthorizedException('No token provided');
    }

    // ... باقي الكود بتاع الـ DB ومقارنة الـ Bcrypt

    const user = await this.userModel
      .findById(payload.sub)
      .select('+currentAccessToken') // نكتفي باللي محتاجينه
      .exec();

    // التحقق بالـ Bcrypt
    const isTokenValid = await bcrypt.compare(
      rawToken,
      user.currentAccessToken,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Session expired');
    }

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      // الـ currentAccessToken هنا هيكون الـ Hash اللي في القاعدة
      accessTokenHash: user.currentAccessToken,
    };
  }
}
