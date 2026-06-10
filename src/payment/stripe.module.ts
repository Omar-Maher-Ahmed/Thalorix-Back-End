import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { BankAccount, BankAccountSchema } from './schema/bank-account.schema';
import { OrdersModule } from '../orders/orders.module';

import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankAccount.name, schema: BankAccountSchema },
    ]),
    OrdersModule,

    AdminModule,
    AuthModule,
  ],
  providers: [StripeService],
  controllers: [StripeController],
  exports: [StripeService],
})
export class StripeModule {}