import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpService } from './otp.service';
import { Otp, OtpSchema } from './schema/otp.schema';
import { OtpRateLimit, OtpRateLimitSchema } from './schema/otp-rate-limit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: OtpRateLimit.name, schema: OtpRateLimitSchema },
    ]),
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
