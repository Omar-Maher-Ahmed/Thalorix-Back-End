import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { MarketPlaceService } from './market_place.service';
import { CreateMarketPlaceDto } from './dto/create-market_place.dto';
import { UpdateMarketPlaceDto } from './dto/update-market_place.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';


@ApiTags('Marketplace')
@Controller('market-place')
export class MarketPlaceController {
  constructor(private readonly marketPlaceService: MarketPlaceService) { }

  // ✅ Create (Authenticated)
  @ApiOperation({ summary: 'Create a marketplace item', description: 'Creates a new marketplace item (Authenticated)' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateMarketPlaceDto })
  @ApiResponse({ status: 201, description: 'Marketplace item created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createMarketPlaceDto: CreateMarketPlaceDto,
    @Req() req: any,
  ) {
    const user = req.user as any;
    return this.marketPlaceService.create(
      createMarketPlaceDto,
      user._id,
    );
  }

  // ✅ Public - Find All with Query
  @ApiOperation({ summary: 'Get all marketplace items', description: 'Retrieves all marketplace items (Public)' })
  @ApiResponse({ status: 200, description: 'Marketplace items retrieved successfully' })
  @Get()
  findAll(@Query() query: any) {
    return this.marketPlaceService.findAll(query);
  }

  // ✅ Public - Find One
  @ApiOperation({ summary: 'Get a marketplace item by ID', description: 'Retrieves a specific marketplace item by ID (Public)' })
  @ApiParam({ name: 'id', description: 'Marketplace item ID', type: String })
  @ApiResponse({ status: 200, description: 'Marketplace item details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID');
    }
    return this.marketPlaceService.findOne(id);
  }

  // ✅ Update (Owner Only)
  @ApiOperation({ summary: 'Update a marketplace item', description: 'Updates an existing marketplace item (Owner Only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Marketplace item ID', type: String })
  @ApiBody({ type: UpdateMarketPlaceDto })
  @ApiResponse({ status: 200, description: 'Marketplace item updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMarketPlaceDto: UpdateMarketPlaceDto,
    @Req() req: any,
  ) {
    const user = req.user as any;
    return this.marketPlaceService.update(
      id,
      updateMarketPlaceDto,
      user._id,
    );
  }

  // ✅ Soft Delete (Owner Only)
  @ApiOperation({ summary: 'Delete a marketplace item', description: 'Soft deletes a marketplace item (Owner Only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Marketplace item ID', type: String })
  @ApiResponse({ status: 200, description: 'Marketplace item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Marketplace item not found' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const user = req.user as any;
    return this.marketPlaceService.remove(id, user._id);
  }
}
