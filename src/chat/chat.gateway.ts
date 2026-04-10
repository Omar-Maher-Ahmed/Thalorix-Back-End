import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map: userId => socketId
  private connectedUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(socket: Socket) {
    try {
      // الـ token بييجي في handshake.auth
      const token = socket.handshake.auth?.token;
      if (!token) return socket.disconnect();

      // verify JWT — نفس logic الـ guard بتاعك
      const userId = this.extractUserIdFromToken(token);
      if (!userId) return socket.disconnect();

      socket.data.userId = userId;
      this.connectedUsers.set(userId, socket.id);

      // اليوزر ينضم لـ room خاص بيه (عشان نبعت له messages)
      socket.join(`user:${userId}`);

      console.log(`User ${userId} connected — socket: ${socket.id}`);
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() socket: Socket,
  ) {
    const senderId = socket.data.userId;

    // validate الـ DTO
    const dtoInstance = plainToInstance(SendMessageDto, dto);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      return socket.emit('error', { message: 'Invalid data', errors });
    }

    try {
      const message = await this.chatService.saveMessage(senderId, dto);

      const payload = {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        receiver: message.receiver,
        conversation: message.conversation,
        createdAt: message['createdAt'],
        isRead: message.isRead,
      };

      // ابعت للمستقبل لو كان online
      this.server.to(`user:${dto.receiverId}`).emit('receive_message', payload);

      // confirm للمرسل
      socket.emit('message_sent', payload);
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() { receiverId }: { receiverId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.server.to(`user:${receiverId}`).emit('user_typing', {
      userId: socket.data.userId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() { receiverId }: { receiverId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.server.to(`user:${receiverId}`).emit('user_stopped_typing', {
      userId: socket.data.userId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() { conversationId }: { conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    await this.chatService.markMessagesAsRead(conversationId, socket.data.userId);
    socket.emit('messages_read', { conversationId });
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      // استخدم نفس الـ JwtService بتاعك
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return payload.sub || payload.id;
    } catch {
      return null;
    }
  }
}