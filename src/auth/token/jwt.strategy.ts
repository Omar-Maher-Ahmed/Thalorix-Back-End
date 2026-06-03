import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/users/schema/user.schema';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { Admin } from 'src/admin/schema/admin.schema';
import { Seller } from 'src/sellers/schema/seller.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Seller.name) private sellerModel: Model<Seller>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const authHeader = req.headers.authorization;
    const rawToken = authHeader ? authHeader.split(' ')[1] : null;

    if (!rawToken) throw new UnauthorizedException('No token provided');

    let user;

    // 1. اختار الموديل الصح بناءً على الـ Role
    if (payload.role === 'admin') {
      user = await this.adminModel
        .findById(payload.sub)
        .select('+currentAccessToken')
        .exec();
    } else if (payload.role === 'seller') {
      user = await this.sellerModel
        .findById(payload.sub)
        .select('+currentAccessToken')
        .exec();
    } else {
      user = await this.userModel
        .findById(payload.sub)
        .select('+currentAccessToken')
        .exec();
    }

    // 2. التحقق من وجود الحساب
    if (!user) throw new UnauthorizedException('Account not found');

    // 3. التحقق من وجود جلسة (Session)
    if (!user.currentAccessToken) {
      throw new UnauthorizedException('No active session, please login again');
    }

    // 4. المقارنة بـ Bcrypt (تأكد إنك مخزن الـ Hash فعلاً في الـ Login)
    const isTokenValid = await bcrypt.compare(
      rawToken,
      user.currentAccessToken,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Session expired or invalidated');
    }

    // 5. رجع البيانات اللي هتحتاجها في الـ Req.user
    return {
      userId: user._id,
      _id: user._id,
      email: user.email,
      role: user.role,
    };
  }
}
