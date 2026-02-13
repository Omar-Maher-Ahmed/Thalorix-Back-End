import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketPlace, MarketPlaceSchema } from './schema/market_place.schema';
import { MarketPlaceService } from './market_place.service';
import { MarketPlaceController } from './market_place.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketPlace.name, schema: MarketPlaceSchema },
    ]),
  ],
  controllers: [MarketPlaceController],
  providers: [MarketPlaceService],
  exports: [MarketPlaceService],
})
export class MarketPlaceModule {}
