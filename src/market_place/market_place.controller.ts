import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MarketPlaceService } from './market_place.service';
import { CreateMarketPlaceDto } from './dto/create-market_place.dto';
import { UpdateMarketPlaceDto } from './dto/update-market_place.dto';

@Controller('market-place')
export class MarketPlaceController {
  constructor(private readonly marketPlaceService: MarketPlaceService) {}

  @Post()
  create(@Body() createMarketPlaceDto: CreateMarketPlaceDto) {
    return this.marketPlaceService.create(createMarketPlaceDto);
  }

  @Get()
  findAll() {
    return this.marketPlaceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketPlaceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarketPlaceDto: UpdateMarketPlaceDto) {
    return this.marketPlaceService.update(+id, updateMarketPlaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketPlaceService.remove(+id);
  }
}
