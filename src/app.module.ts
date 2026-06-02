import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { ChatModule } from './chat/chat.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { OrdersModule } from './orders/orders.module';
import { OtpModule } from './otp/otp.module';
import { MailerModule } from './services/mailer/mailer.module';
import { AdminModule } from './admin/admin.module';
import { CommunityModule } from './community/community.module';
import { SellersModule } from './sellers/sellers.module';
import { CloudinaryModule } from './services/cloudinary/cloudinary.module';
import { AuditLogModule } from './audit/audit-log.module';

@Module({
  imports: [
    AuditLogModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        retryAttempts: 10,
        retryDelay: 3000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 8000,
        heartbeatFrequencyMS: 10000,
        connectionFactory: (connection) => {
          connection.on('connected', () => console.log('🔥 MongoDB Connected Successfully!'));
          connection.on('disconnected', () => console.warn('⚠️ MongoDB Disconnected! Retrying connection...'));
          connection.on('error', (err) => console.error('❌ MongoDB connection error:', err));
          return connection;
        },
      }),
    }),
    AdminModule,
    AuthModule,
    UsersModule,
    SellersModule,
    TemplatesModule,
    ChatModule,
    CategoriesModule,
    AiModule,
    OrdersModule,
    OtpModule,
    MailerModule,
    CommunityModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],

})
export class AppModule {}
