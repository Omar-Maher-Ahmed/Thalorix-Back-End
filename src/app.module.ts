import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MarketPlaceModule } from './market_place/market_place.module';
import { TemplatesModule } from './templates/templates.module';
import { ChatModule } from './chat/chat.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
<<<<<<< HEAD
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProductModule } from './product/product.module';
=======
import { MailModule } from './service/mail/mail.module';
>>>>>>> origin/main

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
<<<<<<< HEAD

=======
>>>>>>> origin/main
    UsersModule,
    AuthModule,
    MarketPlaceModule,
    TemplatesModule,
    ChatModule,
    CategoriesModule,
    AiModule,
<<<<<<< HEAD
    ProductModule,

=======
    MailModule,
>>>>>>> origin/main
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }
