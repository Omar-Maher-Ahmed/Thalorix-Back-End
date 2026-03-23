import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { OtpNotificationService } from './otp-notification.service';
import { SmsService } from './sms.service';
import { Otp, OtpSchema } from './schema/otp.schema';
import { OtpRateLimit, OtpRateLimitSchema } from './schema/otp-rate-limit.schema';
import { MailModule } from 'src/services/mail/mail.module';

@Module({
  imports: [
    MailModule,
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: OtpRateLimit.name, schema: OtpRateLimitSchema },
    ]),
  ],
  providers: [OtpService, OtpNotificationService, SmsService],
  exports: [OtpService],
})
export class OtpModule {}
