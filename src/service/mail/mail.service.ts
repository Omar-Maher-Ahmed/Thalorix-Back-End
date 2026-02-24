// import { Injectable } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';

// @Injectable()
// export class MailService {
//     private transporter: nodemailer.Transporter;

//     constructor() {
//         this.transporter = nodemailer.createTransport({
//             host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to gmail for now, user should configure
//             port: parseInt(process.env.SMTP_PORT || '587'),
//             secure: false, // true for 465, false for other ports
//             auth: {
//                 user: process.env.SMTP_USER,
//                 pass: process.env.SMTP_PASS,
//             },
//         });
//     }

//     async sendPasswordResetEmail(to: string, token: string) {
//         const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
//         const mailOptions = {
//             from: process.env.SMTP_FROM || '"Thalorix Support" <noreply@thalorix.com>',
//             to: to,
//             subject: 'Password Reset Request',
//             html: `
//         <p>You requested a password reset.</p>
//         <p>Click the link below to reset your password:</p>
//         <a href="${resetLink}">Reset Password</a>
//         <p>This link will expire in 1 hour.</p>
//       `,
//         };

//         try {
//             const info = await this.transporter.sendMail(mailOptions);
//             console.log('Message sent: %s', info.messageId);
//             return info;
//         } catch (error) {
//             console.error('Error sending email:', error);
//             throw error;
//         }
//     }
// }



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