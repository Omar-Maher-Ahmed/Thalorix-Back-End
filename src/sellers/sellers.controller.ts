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
  Request,
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
import { SellersService } from './sellers.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { QuerySellerDto } from './dto/query-seller.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/roles.decorator';
import { Roles } from '../auth/enums/roles.enum';

@ApiTags('Sellers')
@Controller('seller')
export class SellersController {
  constructor(private readonly sellersService: SellersService) { }

  // ─────────────────────────────────────────
  // Auth Endpoints (public)
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Register a new seller', description: 'Creates a new seller account and sends a verification OTP to email.' })
  @ApiBody({ type: CreateSellerDto })
  @ApiResponse({ status: 201, description: 'Seller registered. OTP sent to email.' })
  @ApiResponse({ status: 400, description: 'Bad Request / Validation Error' })
  @ApiResponse({ status: 409, description: 'Conflict - Email or phone already exists' })
  @Post('register')
  async register(@Body() createSellerDto: CreateSellerDto) {
    return await this.sellersService.registerSeller(createSellerDto);
  }

  @ApiOperation({ summary: 'Login seller', description: 'Authenticates a seller and returns JWT tokens.' })
  @ApiBody({ type: LoginSellerDto })
  @ApiResponse({ status: 201, description: 'Logged in successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized / Invalid email or password / Account not verified' })
  @Post('login')
  async login(@Body() loginSellerDto: LoginSellerDto) {
    return await this.sellersService.loginSeller(loginSellerDto);
  }

  @ApiOperation({ summary: 'Refresh seller access token', description: 'Uses a valid refresh token to generate new access & refresh tokens.' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Tokens refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return await this.sellersService.refreshSellerToken(refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessTokenGuard)
  @ApiOperation({ summary: 'Logout seller', description: 'Invalidates the seller session by clearing stored tokens.' })
  @ApiResponse({ status: 201, description: 'Logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('logout')
  async logout(@Request() req: any) {
    return await this.sellersService.logoutSeller(req.user.userId);
  }

  // ─────────────────────────────────────────
  // CRUD Endpoints (Admin only)
  // ─────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiOperation({ summary: 'Get all sellers (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email or store name' })
  @ApiResponse({ status: 200, description: 'Paginated list of sellers.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @Get()
  async getSellers(@Query() query: QuerySellerDto) {
    return await this.sellersService.getSellers(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiOperation({ summary: 'Get seller by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Seller found.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @Get(':id')
  async getSellerById(@Param('id') id: string) {
    return await this.sellersService.getSellerById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiOperation({ summary: 'Update seller (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId' })
  @ApiBody({ type: UpdateSellerDto })
  @ApiResponse({ status: 200, description: 'Seller updated successfully.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 409, description: 'Phone number already in use.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @Patch(':id')
  async updateSeller(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    return await this.sellersService.updateSeller(id, updateSellerDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiOperation({ summary: 'Delete seller (Admin only)' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Seller deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @Delete(':id')
  async deleteSeller(@Param('id') id: string) {
    return await this.sellersService.deleteSeller(id);
  }
}
