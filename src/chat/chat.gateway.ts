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
import * as jwt from 'jsonwebtoken'; // تعديل استيراد مكتبة الـ JWT

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

  // الخريطة الآن تدعم بشكل صحيح تعدد التبويبات (Multiple Tabs) لليوزر الواحد
  private connectedUsers = new Map<string, Set<string>>();

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

// إدارة الاتصالات المتعددة لليوزر الواحد بشكل صحيح
const isFirstConnection = !this.connectedUsers.has(userId);

if (isFirstConnection) {
  this.connectedUsers.set(userId, new Set<string>());
}

this.connectedUsers.get(userId)?.add(socket.id);

// مهم جداً
await socket.join(`user:${userId}`);

if (isFirstConnection) {
  this.server.emit('user_status', {
    userId,
    status: 'online',
  });
}
      // Send the list of currently online user IDs to the newly connected user
      socket.emit('online_users', Array.from(this.connectedUsers.keys()));
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;
    if (userId && this.connectedUsers.has(userId)) {
      const userSockets = this.connectedUsers.get(userId);
      
      // مسح السوكيت الحالي فقط المغلق
      if (!userSockets) return;

      userSockets.delete(socket.id);


      // إذا أغلق اليوزر كل التبويبات ولم يتبقَ له أي سوكيت مفتوح
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected completely`);

        // Broadcast offline status to everyone in the chat namespace
        this.server.emit('user_status', { userId, status: 'offline' });
      } else {
        console.log(`User ${userId} closed one tab — remaining sockets: ${userSockets.size}`);
      }
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
        attachmentUrl: message.attachmentUrl,
        replyTo: message.replyTo,
      };

      // ابعت للمستقبل وللمرسل (عشان لو فاتح كذا تابة يتزامنوا لحظياً)
      this.server.to(`user:${dto.receiverId}`).to(`user:${senderId}`).emit('receive_message', payload);

      // confirm للمرسل الأساسي
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
      // تم تعديل الاعتمادية هنا لتستخدم الـ import العلوي المستقر
      const payload = jwt.verify(token, process.env.JWT_SECRET) as any;
      return payload.sub || payload.id;
    } catch {
      return null;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @MessageBody() { messageId, conversationId }: { messageId: string; conversationId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const message = await this.chatService.deleteMessage(messageId, socket.data.userId);
      const rId = message.receiver.toString();
      const sId = message.sender.toString();
      
      // ابعت للمستقبل وللمرسل لحظياً في الغرف الخاصة بهم
      this.server.to(`user:${rId}`).to(`user:${sId}`).emit('message_deleted', { messageId, conversationId });
    } catch (err) {
      socket.emit('error', { message: err?.message || 'Failed to delete message' });
    }
  }
}