import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // كل المحادثات للـ user الحالي
  @Get('conversations')
  getMyConversations(@Req() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  // رسائل محادثة معينة مع pagination
  @Get('conversations/:conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.chatService.getConversationMessages(conversationId, +page, +limit);
  }
}