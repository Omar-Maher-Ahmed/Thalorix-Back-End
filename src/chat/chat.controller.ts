import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
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
    return this.chatService.getUserConversations(req.user.id);
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
}