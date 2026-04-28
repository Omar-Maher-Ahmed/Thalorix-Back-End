import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
// import { VerifyOtpDto, ResendOtpDto } from './dto/verify-otp.dto';

@ApiTags('Sellers')
@Controller('seller')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @ApiOperation({
    summary: 'Register a new seller',
    description:
      'Creates a new seller account and generates an OTP for verification.',
  })
  @ApiBody({ type: CreateSellerDto })
  @ApiResponse({
    status: 201,
    description: 'Seller registered successfully. OTP generated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation Error' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email or phone already exists',
  })
  @Post('register')
  async register(@Body() createSellerDto: CreateSellerDto) {
    return await this.sellersService.registerSeller(createSellerDto);
  }

  @ApiOperation({
    summary: 'Login seller',
    description: 'Authenticates a seller and returns JWT tokens.',
  })
  @ApiBody({ type: LoginSellerDto })
  @ApiResponse({ status: 201, description: 'Logged in successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid credentials / Account not verified',
  })
  @Post('login')
  async login(@Body() loginSellerDto: LoginSellerDto) {
    return await this.sellersService.loginSeller(loginSellerDto);
  }

  // @ApiOperation({ summary: 'Verify OTP', description: 'Verifies the OTP sent to the seller to activate the account.' })
  // @ApiBody({ type: VerifyOtpDto })
  // @ApiResponse({ status: 201, description: 'Account verified successfully.' })
  // @ApiResponse({ status: 400, description: 'Bad Request / Invalid or expired OTP' })
  // @ApiResponse({ status: 404, description: 'Seller not found' })
  // @Post('verify-otp')
  // async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
  //   return await this.sellersService.verifyOtp(verifyOtpDto);
  // }

  // @ApiOperation({ summary: 'Resend OTP', description: 'Generates and sends a new OTP to the seller.' })
  // @ApiBody({ type: ResendOtpDto })
  // @ApiResponse({ status: 201, description: 'New OTP sent.' })
  // @ApiResponse({ status: 400, description: 'Bad Request / Account already verified' })
  // @ApiResponse({ status: 404, description: 'Seller not found' })
  // @Post('resend-otp')
  // async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
  //   return await this.sellersService.resendOtp(resendOtpDto);
  // }
}
