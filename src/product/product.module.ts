import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketPlaceModule } from 'src/market_place/market_place.module';
import { ProductSchema } from './schema/product.schema';
import { CategoriesModule } from 'src/categories/categories.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductController.name, schema: ProductSchema },
    ]),
    MarketPlaceModule,
    CategoriesModule,
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule { }
