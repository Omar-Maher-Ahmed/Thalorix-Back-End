import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MarketPlaceModule } from './market_place/market_place.module';
import { TemplatesModule } from './templates/templates.module';
import { ChatModule } from './chat/chat.module';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { User } from './users/entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    // TypeOrmModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     type: 'postgres',
    //     host: configService.get<string>('DB_HOST'),
    //     port: configService.get<number>('DB_PORT'),
    //     username: configService.get<string>('DB_USERNAME'),
    //     password: configService.get<string>('DB_PASSWORD'),
    //     database: configService.get<string>('DB_NAME'),
    //     entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //     // entities: [User], // old way
    //     synchronize: true,
    //   }),
    //   inject: [ConfigService],
    // }),
    UsersModule,
    AuthModule,
    MarketPlaceModule,
    TemplatesModule,
    ChatModule,
    CategoriesModule,
    AiModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
