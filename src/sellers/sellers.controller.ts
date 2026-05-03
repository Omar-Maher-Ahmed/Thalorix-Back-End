import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { QuerySellerDto } from './dto/query-seller.dto';
import { VerifyOtpDto } from '../otp/dto/otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@ApiTags('Sellers')
@Controller('seller')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  // ─────────────────────────────────────────
  // Auth Endpoints (public)
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Register a new seller', description: 'Creates a new seller account and generates an OTP for verification.' })
  @ApiBody({ type: CreateSellerDto })
  @ApiResponse({ status: 201, description: 'Seller registered successfully. OTP generated.' })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation Error' })
  @ApiResponse({ status: 409, description: 'Conflict - Email or phone already exists' })
  @Post('register')
  async register(@Body() createSellerDto: CreateSellerDto) {
    return await this.sellersService.registerSeller(createSellerDto);
  }

  @ApiOperation({ summary: 'Login seller', description: 'Authenticates a seller and returns JWT tokens.' })
  @ApiBody({ type: LoginSellerDto })
  @ApiResponse({ status: 201, description: 'Logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized / Invalid credentials / Account not verified' })
  @Post('login')
  async login(@Body() loginSellerDto: LoginSellerDto) {
    return await this.sellersService.loginSeller(loginSellerDto);
  }

  @ApiOperation({ summary: 'Verify OTP', description: 'Verifies the OTP sent to the seller to activate the account.' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ status: 201, description: 'Account verified successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request / Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.sellersService.verifyOtp(verifyOtpDto);
  }

  @ApiOperation({ summary: 'Resend OTP', description: 'Generates and sends a new OTP to the seller.' })
  @ApiBody({ type: ResendOtpDto })
  @ApiResponse({ status: 201, description: 'New OTP sent.' })
  @ApiResponse({ status: 400, description: 'Bad Request / Account already verified' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return await this.sellersService.resendOtp(resendOtpDto);
  }

  // ─────────────────────────────────────────
  // CRUD Endpoints (protected)
  // ─────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all sellers', description: 'Returns a paginated list of sellers with optional search.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email or store name' })
  @ApiResponse({ status: 200, description: 'Paginated list of sellers.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async getSellers(@Query() query: QuerySellerDto) {
    return await this.sellersService.getSellers(query);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get seller by ID', description: 'Returns a single seller by their MongoDB ID.' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId', example: '6634b2f3e4b0f4a2d8c1e9a7' })
  @ApiResponse({ status: 200, description: 'Seller found.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  async getSellerById(@Param('id') id: string) {
    return await this.sellersService.getSellerById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update seller', description: 'Updates a seller\'s profile information by ID.' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId', example: '6634b2f3e4b0f4a2d8c1e9a7' })
  @ApiBody({ type: UpdateSellerDto })
  @ApiResponse({ status: 200, description: 'Seller updated successfully.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 409, description: 'Phone number already in use.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id')
  async updateSeller(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    return await this.sellersService.updateSeller(id, updateSellerDto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete seller', description: 'Permanently deletes a seller account by ID.' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId', example: '6634b2f3e4b0f4a2d8c1e9a7' })
  @ApiResponse({ status: 200, description: 'Seller deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  async deleteSeller(@Param('id') id: string) {
    return await this.sellersService.deleteSeller(id);
  }
}
