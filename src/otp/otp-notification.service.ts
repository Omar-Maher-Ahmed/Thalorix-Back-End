import { Injectable } from '@nestjs/common';
import { SmsService } from './sms.service';
import { MailerService } from '../services/mailer/mailer.service';
import { OtpType } from './schema/otp.schema';

/** Maps OTP type to a human-readable action label shown in the email/SMS. */
const ACTION_LABELS: Record<OtpType, string> = {
  [OtpType.EMAIL_VERIFICATION]: 'email verification',
  [OtpType.PHONE_VERIFICATION]: 'phone verification',
  [OtpType.PASSWORD_RESET]: 'password reset',
  [OtpType.SELLER_VERIFICATION]: 'seller verification',
  [OtpType.ADMIN_VERIFICATION]: 'admin account verification',
};

@Injectable()
export class OtpNotificationService {
  constructor(
    private readonly smsService: SmsService,
    private readonly mailerService: MailerService,
  ) {}

  /** Send OTP via email using the global MailerService. */
  async sendByEmail(
    email: string,
    otp: string,
    type: OtpType,
    name?: string,
  ): Promise<void> {
    await this.mailerService.sendOtpEmail({
      email,
      name: name ?? 'User',
      otp,
      expiresIn: '10 minutes', // Match with OTP_TTL_MS in OtpService
    }, ACTION_LABELS[type]);
  }

  /** Send OTP via SMS (dev: logs to console). */
  async sendByPhone(
    phone: string,
    otp: string,
    type: OtpType,
  ): Promise<void> {
    await this.smsService.sendOtp(phone, otp, ACTION_LABELS[type]);
  }
}
