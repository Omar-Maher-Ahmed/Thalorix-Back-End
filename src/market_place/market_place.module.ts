import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketPlace, MarketPlaceSchema } from './schema/market_place.schema';
import { MarketPlaceService } from './market_place.service';
import { MarketPlaceController } from './market_place.controller';
import { Category, CategorySchema } from '../categories/schema/category.schema';
import { Template, TemplateSchema } from '../templates/schema/template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketPlace.name, schema: MarketPlaceSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
  ],
  controllers: [MarketPlaceController],
  providers: [MarketPlaceService],
  exports: [MarketPlaceService],
})
export class MarketPlaceModule {}
