
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';

import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) { }

  // 🟢 Create Post
  @Post('post')
  createPost(@Body() dto: CreatePostDto) {
    return this.service.createPost(dto);
  }

  // 🟢 Get Feed
  @Get('feed')
  getFeed() {
    return this.service.getFeed();
  }

  // 🟢 Update Post
  @Patch('post/:id')
  updatePost(@Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.service.updatePost(id, dto);
  }

  // 🟢 Delete Post
  @Delete('post/:id')
  deletePost(@Param('id') id: string) {
    return this.service.deletePost(id);
  }

  // 🟢 Add Comment
  @Post(':id/comment')
  addComment(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(postId, dto);
  }

  // 🟢 Get Comments
  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.service.getComments(postId);
  }

  // 🟢 Update Comment
  @Patch('comment/:id')
  updateComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.updateComment(id, dto);
  }

  // 🟢 Delete Comment
  @Delete('comment/:id')
  deleteComment(@Param('id') id: string) {
    return this.service.deleteComment(id);
  }
}