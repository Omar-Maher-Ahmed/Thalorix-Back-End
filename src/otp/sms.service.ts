import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS service — development/testing strategy.
 *
 * In development the OTP is logged to the console so you can test
 * without any SMS provider or credits.
 *
 * To switch to a real provider (Twilio, Vonage, Termii, …) later:
 *   1. Install the provider's SDK
 *   2. Replace the Logger.log() call below with the real send call
 *   3. Read credentials from ConfigService
 *   4. No other file needs to change — the interface stays the same
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(phone: string, otp: string, action?: string): Promise<void> {
    // ── DEV MODE ──────────────────────────────────────────────────────────────
    // Log the OTP to the console instead of sending a real SMS.
    // Replace this block with a real SMS provider call for production.
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.warn(`📱  DEV SMS — To: ${phone}`);
    this.logger.warn(`     Action : ${action ?? 'verification'}`);
    this.logger.warn(`     OTP    : ${otp}`);
    this.logger.warn(`     Valid  : 10 minutes`);
    this.logger.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}
