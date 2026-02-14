import {
  Controller,
  Post,
  Body
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  WebsiteSignUpDto,
  MobileSignUpDto,
  MobileLoginDto,
  WebsiteLoginDto
} from '../auth/dto';
import { SignupValidationPipe } from '../auth/pips/signup.validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('api/v1/web/register')
  websiteRegister(
    @Body(new SignupValidationPipe()) websiteSignUp: WebsiteSignUpDto,
  ) {
    return this.authService.websiteRegister(websiteSignUp);
  }

  @Post('api/v1/mob/register')
  mobileRegister(
    @Body(new SignupValidationPipe()) mobileSignUp: MobileSignUpDto,
  ) {
    return this.authService.mobileRegister(mobileSignUp);
  }

  @Post('api/v1/web/login')
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return this.authService.websiteLogin(websiteLogin);
  }

  @Post('api/v1/mob/login')
  async mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return this.authService.mobileLogin(mobileLogin);
  }
}