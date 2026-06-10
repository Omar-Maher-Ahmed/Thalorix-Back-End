import { Module, Global } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';

import { JwtStrategy } from '../auth/token/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminSchema } from 'src/admin/schema/admin.schema';
import { Seller, SellerSchema } from '../sellers/schema/seller.schema';
import { Block, BlockSchema } from './schema/block.schema';
import { FriendRequest, FriendRequestSchema } from '../friend-request/schema/friend-request.schema';
import { AuditLog, AuditLogSchema } from '../audit/schema/audit-log.schema';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Seller.name, schema: SellerSchema },
      { name: Block.name, schema: BlockSchema },
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),


  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [MongooseModule],
})
export class UsersModule {}
