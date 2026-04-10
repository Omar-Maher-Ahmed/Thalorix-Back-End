export interface IMailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

export interface ISendOtpEmailOptions {
  email: string;
  name: string;
  otp: string;
  expiresIn: string;
}

export interface ISendVerificationEmailOptions {
  email: string;
  name: string;
  verificationLink: string;
}
