import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Seller, SellerSchema } from './schema/seller.schema';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Seller.name, schema: SellerSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') as string,
        signOptions: {
          expiresIn: Number(config.get('JWT_ACCESS_EXPIRES')) || 900, // Default 15m
        },
      }),
    }),
  ],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [MongooseModule, SellersService],
})
export class SellersModule {}
