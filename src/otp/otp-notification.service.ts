import { Injectable } from '@nestjs/common';
import { SmsService } from './sms.service';
import { OtpType } from './schema/otp.schema';

/** Maps OTP type to a human-readable action label shown in the email/SMS. */
const ACTION_LABELS: Record<OtpType, string> = {
  [OtpType.EMAIL_VERIFICATION]: 'email verification',
  [OtpType.PHONE_VERIFICATION]: 'phone verification',
  [OtpType.PASSWORD_RESET]: 'password reset',
};

@Injectable()
export class OtpNotificationService {
  constructor(
    private readonly smsService: SmsService,
  ) {}

  /** Send OTP via SMS (dev: logs to console). */
  async sendByPhone(
    phone: string,
    otp: string,
    type: OtpType,
  ): Promise<void> {
    await this.smsService.sendOtp(phone, otp, ACTION_LABELS[type]);
  }
}
