import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendRequest, FriendRequestSchema } from './schema/friend-request.schema';
import { FriendRequestService } from './friend-request.service';
import { FriendRequestController } from './friend-request.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRequest.name, schema: FriendRequestSchema },
    ]),
    AuthModule,
  ],
  controllers: [FriendRequestController],
  providers: [FriendRequestService],
  exports: [FriendRequestService, MongooseModule],
})
export class FriendRequestModule {}
