import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schema/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    console.log('\n' + '='.repeat(60));
    console.log('🔥 JWT Payload:', payload);

    // ✅ مهم: استخدم select عشان تجيب currentAccessToken
    const user = await this.userModel
      .findById(payload.sub)
      .select('+currentAccessToken +refreshToken') // جيب الاتنين
      .exec();

    console.log(
      '📊 User from DB:',
      user
        ? {
            id: user._id,
            email: user.email,
            hasAccessToken: !!user.currentAccessToken,
            hasRefreshToken: !!user.refreshToken,
          }
        : '❌ NOT FOUND',
    );

    if (!user) {
      console.log('❌ User not found in database!');
      throw new UnauthorizedException('User not found');
    }

    if (user.isBlocked || user.isDeleted) {
      console.log('❌ User is blocked or deleted');
      throw new UnauthorizedException('Account not available');
    }

    console.log('✅ User validated:', user.email);
    console.log('='.repeat(60) + '\n');

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      currentAccessToken: user.currentAccessToken,
    };
  }
}
