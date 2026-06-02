import { Controller, Get, Param, Query, UseGuards, Req, Post, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // كل المحادثات للـ user الحالي
  @ApiOperation({ summary: 'Get user conversations', description: 'Retrieves all conversations for the currently logged-in user' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('conversations')
  getMyConversations(@Req() req) {
    return this.chatService.getUserConversations(req.user.userId);
  }

  @ApiOperation({ summary: 'Start a direct conversation', description: 'Starts or retrieves a direct conversation with another user' })
  @ApiResponse({ status: 201, description: 'Conversation started successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'string' } } } })
  @Post('conversations/start')
  startConversation(@Req() req, @Body('userId') userId: string) {
    return this.chatService.startDirectConversation(req.user.userId, userId);
  }

  // رسائل محادثة معينة مع pagination
  @ApiOperation({ summary: 'Get conversation messages', description: 'Retrieves messages for a specific conversation with pagination' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number, example: 30 })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @Get('conversations/:conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.chatService.getConversationMessages(conversationId, +page, +limit);
  }

  @ApiOperation({ summary: 'Search messages in a conversation', description: 'Searches for a specific keyword in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID', type: String })
  @ApiQuery({ name: 'q', required: true, description: 'Search query', type: String })
  @ApiResponse({ status: 200, description: 'Search results' })
  @Get('conversations/:conversationId/search')
  searchMessages(
    @Param('conversationId') conversationId: string,
    @Query('q') query: string,
    @Req() req,
  ) {
    return this.chatService.searchMessages(conversationId, query, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete a message', description: 'Deletes a specific message owned by the user' })
  @ApiParam({ name: 'id', description: 'Message ID', type: String })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @Delete('messages/:id')
  deleteMessage(@Param('id') id: string, @Req() req) {
    return this.chatService.deleteMessage(id, req.user.userId);
  }

  @ApiOperation({ summary: 'Delete a conversation', description: 'Soft deletes a conversation for the current user' })
  @ApiParam({ name: 'id', description: 'Conversation ID', type: String })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @Req() req) {
    return this.chatService.deleteConversation(id, req.user.userId);
  }
}