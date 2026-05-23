import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import {
  ISendOtpEmailOptions,
  ISendVerificationEmailOptions,
  IMailOptions,
} from './mailer.interface';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailerService: NestMailerService) {}

  /**
   * Base reusable email sending function
   */
  async sendEmail(options: IMailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: {
          ...options.context,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(
        `Email successfully sent to ${options.to} using template ${options.template}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sends an OTP email
   */
  async sendOtpEmail(
    options: ISendOtpEmailOptions,
    actionLabel: string = 'verification',
  ): Promise<void> {
    await this.sendEmail({
      to: options.email,
      subject: `Your OTP Code - ${actionLabel}`,
      template: 'otp', // assumes .hbs extension is configured in module
      context: {
        name: options.name,
        otp: options.otp,
        expiresIn: options.expiresIn,
        action: actionLabel,
      },
    });
  }

  /**
   * Sends a verification email
   */
  async sendVerificationEmail(
    options: ISendVerificationEmailOptions,
  ): Promise<void> {
    await this.sendEmail({
      to: options.email,
      subject: 'Verify Your Email Address',
      template: 'verification',
      context: {
        name: options.name,
        verificationLink: options.verificationLink,
      },
    });
  }
}
