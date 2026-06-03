import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schema/user.schema';
import { Admin, AdminSchema } from '../admin/schema/admin.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/token/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RolesGuard } from './guards/roles.guard';
import { OtpModule } from '../otp/otp.module';

import { Seller, SellerSchema } from '../sellers/schema/seller.schema';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Seller.name, schema: SellerSchema },
    ]),
    OtpModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') as string,
        signOptions: {
          expiresIn: Number(config.get('JWT_ACCESS_EXPIRES')),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AccessTokenGuard, RolesGuard],
  exports: [AccessTokenGuard, RolesGuard, MongooseModule],
})
export class AuthModule {}
