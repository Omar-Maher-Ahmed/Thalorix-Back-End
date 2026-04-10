import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { OtpNotificationService } from './otp-notification.service';
import { SmsService } from './sms.service';
import { Otp, OtpSchema } from './schema/otp.schema';
import { OtpRateLimit, OtpRateLimitSchema } from './schema/otp-rate-limit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: OtpRateLimit.name, schema: OtpRateLimitSchema },
    ]),
  ],
  controllers: [OtpController],
  providers: [OtpService, OtpNotificationService, SmsService],
  exports: [OtpService],
})
export class OtpModule {}
