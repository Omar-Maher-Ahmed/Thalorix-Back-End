import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

import { Post, PostSchema } from './schemas/post.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { PostLike, PostLikeSchema } from './schemas/post-like.schema';

import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: PostLike.name, schema: PostLikeSchema },
    ]),

    AdminModule,
    AuthModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule { }