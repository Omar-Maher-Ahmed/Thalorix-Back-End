import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MarketPlaceModule } from './market_place/market_place.module';
import { TemplatesModule } from './templates/templates.module';
import { ChatModule } from './chat/chat.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [UsersModule, MarketPlaceModule, TemplatesModule, ChatModule, CategoriesModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
