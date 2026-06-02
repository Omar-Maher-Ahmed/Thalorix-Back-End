import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { Conversation, ConversationDocument } from './schema/conversation.schema';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  async getOrCreateConversation(userId1: string, userId2: string): Promise<ConversationDocument> {
    const u1 = new Types.ObjectId(userId1);
    const u2 = new Types.ObjectId(userId2);

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [u1, u2], $size: 2 },
      type: 'direct',
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [u1, u2],
        type: 'direct',
      });
    }

    return conversation;
  }

  async startDirectConversation(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new NotFoundException('Cannot start conversation with yourself');
    }
    const conversation = await this.getOrCreateConversation(userId1, userId2);
    return { conversationId: conversation._id };
  }

  async saveMessage(senderId: string, dto: SendMessageDto): Promise<MessageDocument> {
    const conversation = await this.getOrCreateConversation(senderId, dto.receiverId);

    const message = await this.messageModel.create({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(dto.receiverId),
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : undefined,
      conversation: conversation._id,
    });

    // update lastMessage و unreadCount
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      $inc: { unreadCount: 1 },
    });

    return message.populate(['sender', 'receiver', 'replyTo']);
  }

  async getConversationMessages(
    conversationId: string,
    page = 1,
    limit = 30,
  ) {
    const skip = (page - 1) * limit;
    return this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .populate('replyTo', 'content sender')
      .lean();
  }

  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
        deletedBy: { $ne: new Types.ObjectId(userId) }
      })
      .populate('participants', 'name avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        receiver: new Types.ObjectId(userId),
        isRead: false,
      },
      { 
        isRead: true,
        status: 'read',
        readAt: new Date()
      },
    );

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      unreadCount: 0,
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new UnauthorizedException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.attachmentUrl = undefined;

    return message.save();
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new UnauthorizedException('You are not a participant in this conversation');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (!conversation.deletedBy?.includes(userObjectId)) {
      if (!conversation.deletedBy) conversation.deletedBy = [];
      conversation.deletedBy.push(userObjectId);
      await conversation.save();
    }

    return { success: true };
  }

  async searchMessages(conversationId: string, query: string, userId: string) {
    return this.messageModel
      .find({
        conversation: new Types.ObjectId(conversationId),
        content: { $regex: query, $options: 'i' },
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .lean();
  }
}