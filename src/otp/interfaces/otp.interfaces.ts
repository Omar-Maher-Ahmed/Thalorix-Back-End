export interface ISmsService {
  sendOtp(phone: string, otp: string, action?: string): Promise<void>;
}
