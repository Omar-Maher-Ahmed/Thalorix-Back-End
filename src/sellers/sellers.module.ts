import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigService } from '@nestjs/config';
import { Seller, SellerSchema } from './schema/seller.schema';
import { Review, ReviewSchema } from './schema/review.schema';
import { Template, TemplateSchema } from '../templates/schema/template.schema';
import { Order, OrderSchema } from '../orders/schema/order.schema';
import { User, UserSchema } from '../users/schema/user.schema';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';

import { CloudinaryModule } from '../services/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Seller.name, schema: SellerSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),

    CloudinaryModule,

  ],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [MongooseModule, SellersService],
})
export class SellersModule {}
