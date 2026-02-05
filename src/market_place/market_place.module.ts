import { Module } from '@nestjs/common';
import { MarketPlaceService } from './market_place.service';
import { MarketPlaceController } from './market_place.controller';

@Module({
  controllers: [MarketPlaceController],
  providers: [MarketPlaceService],
})
export class MarketPlaceModule {}
