
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import {
  UpdateUserDto,
  WebsiteSignUpDto,
  MobileSignUpDto,
  MobileLoginDto,
  WebsiteLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../auth/dto';

import { SignupValidationPipe } from '../auth/pips/signup.validation.pipe';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { Roles } from 'src/auth/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/decorators/roles.decorator';



  @Post('api/v1/web/register')
  websiteRegister(
    @Body(new SignupValidationPipe()) websiteSignUp: WebsiteSignUpDto,
  ) {
    return this.usersService.websiteRegister(websiteSignUp);
  }

  @Post('api/v1/mob/register')
  mobileRegister(
    @Body(new SignupValidationPipe()) mobileSignUp: MobileSignUpDto,
  ) {
    return this.usersService.mobileRegister(mobileSignUp);
  }

  @Post('api/v1/web/login')
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return this.usersService.websiteLogin(websiteLogin);
  }

  @Post('api/v1/mob/login')
  async mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return this.usersService.mobileLogin(mobileLogin);
  }
