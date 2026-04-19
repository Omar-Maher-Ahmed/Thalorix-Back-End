import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { RequestOtpDto, OtpVerifyDto } from './dto/otp.dto';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or active OTP exists',
  })
  async requestOtp(@Body() dto: RequestOtpDto) {
    const code = await this.otpService.createOtp(dto.type, {
      email: dto.email,
      // phone: dto.phone,
      userId: undefined,
      name: dto.name,
    });

    return {
      success: true,
      message: 'OTP has been sent to your ' + (dto.email ? 'email' : 'phone'),
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OTP' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    const isValid = await this.otpService.validateOtp(dto.code, dto.type, {
      email: dto.email,
      // phone: dto.phone,
    });

    return {
      success: isValid,
      message: 'OTP verified successfully',
    };
  }
}
