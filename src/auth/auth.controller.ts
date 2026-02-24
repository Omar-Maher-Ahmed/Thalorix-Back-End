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
  WebsiteLoginDto
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
}