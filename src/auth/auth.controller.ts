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

  @Post('web/register')
  websiteRegister(
    @Body(new SignupValidationPipe()) websiteSignUp: WebsiteSignUpDto,
  ) {
    return this.authService.websiteRegister(websiteSignUp);
  }

  @Post('mob/register')
  mobileRegister(
    @Body(new SignupValidationPipe()) mobileSignUp: MobileSignUpDto,
  ) {
    return this.authService.mobileRegister(mobileSignUp);
  }

  @Post('web/login')
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return this.authService.websiteLogin(websiteLogin);
  }

  @Post('mob/login')
  async mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return this.authService.mobileLogin(mobileLogin);
  }
}