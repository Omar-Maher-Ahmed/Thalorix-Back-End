import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  // ✅ Create Post
  @Post('post')
  createPost(@Req() req, @Body() dto: CreatePostDto) {
    return this.service.createPost(req.user.id, dto);
  }

  // ✅ Feed
  @Get('feed')
  getFeed() {
    return this.service.getFeed();
  }

  // ✅ Like
  @Post(':id/like')
  likePost(@Param('id') id: string) {
    return this.service.likePost(id);
  }

  // ✅ Add Comment
  @Post(':id/comment')
  addComment(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(id, req.user.id, dto);
  }

  // ✅ Get Comments
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.service.getComments(id);
  }
}