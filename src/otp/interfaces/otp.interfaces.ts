export interface ISmsService {
  sendOtp(phone: string, otp: string, action?: string): Promise<void>;
}

// export interface IMailService {
//   sendOtp(
//     email: string,
//     otp: string,
//     options?: { name?: string; action?: string },
//   ): Promise<void>;
// }
