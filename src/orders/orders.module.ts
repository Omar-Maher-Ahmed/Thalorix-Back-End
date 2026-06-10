import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schema/order.schema';
import { Template, TemplateSchema } from '../templates/schema/template.schema';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [

    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}