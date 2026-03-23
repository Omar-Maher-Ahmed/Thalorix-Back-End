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

  async sendOtp(
    email: string,
    otp: string,
    context: { name?: string; action?: string } = {},
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Your verification code',
      template: 'otp',
      context: {
        name: context.name ?? 'there',
        action: context.action ?? 'verification',
        otp,
        year: new Date().getFullYear(),
      },
    });
  }
}