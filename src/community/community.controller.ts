import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  // 🟢 Feed
  @Get('feed')
  getFeed() {
    return this.service.getFeed();
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
}