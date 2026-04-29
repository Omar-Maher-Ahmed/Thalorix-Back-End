import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './schema/category.schema';
import { MarketPlace, MarketPlaceSchema } from '../market_place/schema/market_place.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: MarketPlace.name,
        schema: MarketPlaceSchema,
      },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // 👈 مهم لو هتستخدمه فى موديل تانى
})
export class CategoriesModule {}
