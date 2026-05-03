import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new OTP' })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.otpService.createOtp(dto.type, {
      email: dto.email,
      phone: dto.phone,
      name: dto.name,
    });
    return {
      success: true,
      message: 'OTP has been sent to your ' + (dto.email ? 'email' : 'phone'),
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP (unified)',
    description:
      'Send email/phone + code. The system auto-detects the OTP type and updates the relevant entity (User or Seller isVerified) automatically.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 200, description: 'OTP verified — entity updated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'User or Seller not found' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyAndUpdate(dto.code, {
      email: dto.email,
      phone: dto.phone,
    });
  }
}
