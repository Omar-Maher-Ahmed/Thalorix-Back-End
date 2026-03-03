import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerification(email: string, name: string, url: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Verify your account',
      template: 'verification',
      context: { name, url },
    });
  }

  async sendResetPassword(email: string, name: string, url: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Reset your password',
      template: 'reset',
      context: { name, url },
    });
  }

  async sendOtp(email: string, otp: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Your OTP Code',
      html: `<h2>Your OTP is: ${otp}</h2>`,
    });
  }
}