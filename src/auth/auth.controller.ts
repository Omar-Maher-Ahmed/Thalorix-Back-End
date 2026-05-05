import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  WebsiteSignUpDto,
  MobileSignUpDto,
  MobileLoginDto,
  WebsiteLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../auth/dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Website user registration',
    description: 'Registers a new user from the website',
  })
  @ApiBody({ type: WebsiteSignUpDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
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

      if (
        websiteSignUp.name.includes('<') ||
        websiteSignUp.name.includes('>')
      ) {
        throw new BadRequestException('Name cannot contain HTML tags');
      }
    }

    return this.authService.websiteRegister(websiteSignUp);
  }

  @ApiOperation({
    summary: 'Mobile user registration',
    description: 'Registers a new user from a mobile device',
  })
  @ApiBody({ type: MobileSignUpDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('mob/register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  mobileRegister(@Body() mobileSignUp: MobileSignUpDto) {
    return this.authService.mobileRegister(mobileSignUp);
  }

  @ApiOperation({
    summary: 'Website user login',
    description: 'Authenticates a website user and returns a token',
  })
  @ApiBody({ type: WebsiteLoginDto })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('web/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return this.authService.websiteLogin(websiteLogin);
  }

  @ApiOperation({
    summary: 'Mobile user login',
    description: 'Authenticates a mobile user and returns a token',
  })
  @ApiBody({ type: MobileLoginDto })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('mob/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return this.authService.mobileLogin(mobileLogin);
  }

  @ApiOperation({
    summary: 'Refresh token',
    description: 'Refreshes the authentication token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the current user',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  @ApiOperation({
    summary: 'Forgot password',
    description: 'Initiates the forgot password process',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 201,
    description: 'Forgot password process initiated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets the user password using OTP',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 201, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
