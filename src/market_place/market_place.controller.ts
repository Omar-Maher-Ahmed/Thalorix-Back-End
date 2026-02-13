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
import { Types } from 'mongoose';
import { MarketPlaceService } from './market_place.service';
import { CreateMarketPlaceDto } from './dto/create-market_place.dto';
import { UpdateMarketPlaceDto } from './dto/update-market_place.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';


@Controller('market-place')
export class MarketPlaceController {
  constructor(private readonly marketPlaceService: MarketPlaceService) { }

  // ✅ Create (Authenticated)
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
  @Get()
  findAll(@Query() query: any) {
    return this.marketPlaceService.findAll(query);
  }

  // ✅ Public - Find One
  @Get(':id')
  findOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ID');
    }
    return this.marketPlaceService.findOne(id);
  }

  // ✅ Update (Owner Only)
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
