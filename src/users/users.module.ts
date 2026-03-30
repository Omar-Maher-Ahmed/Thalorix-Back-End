
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/token/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';


@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),


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
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [MongooseModule]
})
export class UsersModule { }
