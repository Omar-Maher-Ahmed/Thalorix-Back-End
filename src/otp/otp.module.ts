import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { OtpNotificationService } from './otp-notification.service';
import { SmsService } from './sms.service';
import { Otp, OtpSchema } from './schema/otp.schema';
import {
  OtpRateLimit,
  OtpRateLimitSchema,
} from './schema/otp-rate-limit.schema';
import { User, UserSchema } from '../users/schema/user.schema'; // تأكد من صحة المسار لملف اليوزر

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: OtpRateLimit.name, schema: OtpRateLimitSchema },
      { name: User.name, schema: UserSchema }, // أضفنا موديل اليوزر هنا عشان الـ Service يشوفه
    ]),
  ],
  controllers: [OtpController],
  providers: [OtpService, OtpNotificationService, SmsService],
  exports: [OtpService],
})
export class OtpModule {}
