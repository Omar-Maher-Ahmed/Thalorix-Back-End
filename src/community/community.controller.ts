
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) { }

  // 🟢 Create Post
  @ApiOperation({ summary: 'Create a post', description: 'Creates a new community post' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('post')
  createPost(@Body() dto: CreatePostDto) {
    return this.service.createPost(dto);
  }

  // 🟢 Get Feed
  @ApiOperation({ summary: 'Get community feed', description: 'Retrieves the community feed' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  @Get('feed')
  getFeed() {
    return this.service.getFeed();
  }

  // 🟢 Get Top Posts
  @ApiOperation({ summary: 'Get top 5 posts', description: 'Retrieves the top 5 posts sorted by number of likes' })
  @ApiResponse({ status: 200, description: 'Top posts retrieved successfully' })
  @Get('top-posts')
  getTopPosts() {
    return this.service.getTopPosts();
  }

  // 🟢 Update Post
  @ApiOperation({ summary: 'Update a post', description: 'Updates an existing community post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Patch('post/:id')
  updatePost(@Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.service.updatePost(id, dto);
  }

  // 🟢 Delete Post
  @ApiOperation({ summary: 'Delete a post', description: 'Deletes a community post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Delete('post/:id')
  deletePost(@Param('id') id: string) {
    return this.service.deletePost(id);
  }

  // 🟢 Add Comment
  @ApiOperation({ summary: 'Add a comment', description: 'Adds a comment to a specific post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post(':id/comment')
  addComment(
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.addComment(postId, dto);
  }

  // 🟢 Get Comments
  @ApiOperation({ summary: 'Get comments for a post', description: 'Retrieves all comments for a specific post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Get(':id/comments')
  getComments(@Param('id') postId: string) {
    return this.service.getComments(postId);
  }

  // 🟢 Update Comment
  @ApiOperation({ summary: 'Update a comment', description: 'Updates an existing comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: String })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Patch('comment/:id')
  updateComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.updateComment(id, dto);
  }

  // 🟢 Delete Comment
  @ApiOperation({ summary: 'Delete a comment', description: 'Deletes a specific comment' })
  @ApiParam({ name: 'id', description: 'Comment ID', type: String })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Delete('comment/:id')
  deleteComment(@Param('id') id: string) {
    return this.service.deleteComment(id);
  }

  // 🟢 Toggle Like Post
  @ApiOperation({ summary: 'Toggle like on a post', description: 'Likes or unlikes a community post' })
  @ApiParam({ name: 'id', description: 'Post ID', type: String })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, AccessTokenGuard)
  @ApiResponse({ status: 200, description: 'Post liked/unliked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @Post('post/:id/like')
  toggleLike(
    @Param('id') postId: string,
    @Req() req: any,
  ) {
    return this.service.toggleLike(postId, req.user.userId);
  }
}