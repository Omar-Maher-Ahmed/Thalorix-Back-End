import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OtpService } from './otp/otp.service';
import { OtpType } from './otp/schema/otp.schema';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TestOTP');
  logger.log('🚀 Starting OTP & Mailer Test...');

  // 1. Create a NestJS application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // 2. Resolve the OtpService
    const otpService = app.get(OtpService);

    const testEmail = 'test1@example.com';
    const testName = 'Test User';

    logger.log(`📧 Requesting OTP for: ${testEmail}`);

    // 3. Trigger OTP creation
    // This will hit the Rate Limiter, generate a code, save to DB, and call MailerService
    const code = await otpService.createOtp(OtpType.EMAIL_VERIFICATION, {
      email: testEmail,
      name: testName,
    });

    logger.log('✅ Success!');
    logger.log(`🔢 Generated Code : ${code}`);
    logger.log('ℹ️  Check the terminal logs above for the "📧 DEV EMAIL" box.');

  } catch (error) {
    logger.error(`❌ Test failed: ${error.message}`);
    if (error.response) {
      logger.error('Response details:', JSON.stringify(error.response));
    }
  } finally {
    // 4. Close the application context
    await app.close();
    logger.log('🏁 Test finished.');
  }
}

bootstrap();
