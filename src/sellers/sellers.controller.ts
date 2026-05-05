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

@ApiTags('Sellers')
@Controller('seller')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

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
  @ApiResponse({ status: 401, description: 'Unauthorized / Invalid credentials / Account not verified' })
  @Post('login')
  async login(@Body() loginSellerDto: LoginSellerDto) {
    return await this.sellersService.loginSeller(loginSellerDto);
  }

  // ─────────────────────────────────────────
  // CRUD Endpoints (protected)
  // ─────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all sellers' })
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
  @ApiOperation({ summary: 'Get seller by ID' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Seller found.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id')
  async getSellerById(@Param('id') id: string) {
    return await this.sellersService.getSellerById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update seller' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId' })
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
  @ApiOperation({ summary: 'Delete seller' })
  @ApiParam({ name: 'id', description: 'Seller MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Seller deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Seller not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  async deleteSeller(@Param('id') id: string) {
    return await this.sellersService.deleteSeller(id);
  }
}
