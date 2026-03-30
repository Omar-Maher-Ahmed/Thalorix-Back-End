import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Request
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  WebsiteSignUpDto,
  MobileSignUpDto,
  MobileLoginDto,
  WebsiteLoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto
} from '../auth/dto';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('web/register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async signup(@Body() websiteSignUp: WebsiteSignUpDto) {
    if (websiteSignUp.name) {
      websiteSignUp.name = websiteSignUp.name
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x?[0-9A-F]+;/gi, '');

      if (websiteSignUp.name.includes('<') || websiteSignUp.name.includes('>')) {
        throw new BadRequestException('Name cannot contain HTML tags');
      }
    }

    return this.authService.websiteRegister(websiteSignUp);
  }

  @Post('mob/register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  mobileRegister(
    @Body() mobileSignUp: MobileSignUpDto,
  ) {
    return this.authService.mobileRegister(mobileSignUp);
  }

  @Post('web/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return this.authService.websiteLogin(websiteLogin);
  }

  @Post('mob/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return this.authService.mobileLogin(mobileLogin);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Post('logout')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  // [OTP Integration]: راوت خاص لمرحلة الاسترجاع (الخطوة الأولى)، بيستقبل الإيميل أو التليفون ويبعت له الكود
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  // [OTP Integration]: راوت جديد بيستقبل طلب التفعيل للكود اللي جال للمستخدم سواء وقت التسجيل
  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // [OTP Integration]: راوت جديد بياخد الكود والباسورد الجديد وبيتم عليهم عملية التغيير مع فحص الكود
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}