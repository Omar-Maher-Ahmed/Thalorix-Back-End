import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  // جيب أو انشئ conversation بين يوزرين
  async getOrCreateConversation(userId1: string, userId2: string): Promise<ConversationDocument> {
    const u1 = new Types.ObjectId(userId1);
    const u2 = new Types.ObjectId(userId2);

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [u1, u2] },
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants: [u1, u2],
      });
    }

    return conversation;
  }

  async saveMessage(senderId: string, dto: SendMessageDto): Promise<MessageDocument> {
    const conversation = await this.getOrCreateConversation(senderId, dto.receiverId);

    const message = await this.messageModel.create({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(dto.receiverId),
      content: dto.content,
      conversation: conversation._id,
    });

    // update lastMessage و unreadCount
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      $inc: { unreadCount: 1 },
    });

    return message.populate(['sender', 'receiver']);
  }

  async getConversationMessages(
    conversationId: string,
    page = 1,
    limit = 30,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation ID');
    }
    const skip = (page - 1) * limit;
    return this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .lean();
  }

  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversation ID');
    }
    await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        receiver: new Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true },
    );

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      unreadCount: 0,
    });
  }
}