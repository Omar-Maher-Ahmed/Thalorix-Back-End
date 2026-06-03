import { Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Message, MessageDocument } from './schema/message.schema';
import { Conversation, ConversationDocument } from './schema/conversation.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { User } from '../users/schema/user.schema';
import { Seller } from '../sellers/schema/seller.schema';
import { Admin } from '../admin/schema/admin.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Seller.name) private sellerModel: Model<Seller>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUserOrSellerOrAdmin(id: string | Types.ObjectId) {
    if (!id) return null;
    const userId = id.toString();
    
    // Check User
    const userAccount = await this.userModel.findById(userId).select('name avatarUrl role').lean();
    if (userAccount) return { _id: userAccount._id, name: userAccount.name, avatar: userAccount.avatarUrl, role: userAccount.role || 'user' };
    
    // Check Seller
    const sellerAccount = await this.sellerModel.findById(userId).select('name logo role storeName').lean();
    if (sellerAccount) {
      return { 
        _id: sellerAccount._id,
        name: sellerAccount.storeName || sellerAccount.name, 
        avatar: sellerAccount.logo,
        role: 'seller'
      };
    }
    
    // Check Admin
    const adminAccount = await this.adminModel.findById(userId).select('name avatarUrl role').lean();
    if (adminAccount) return { _id: adminAccount._id, name: adminAccount.name, avatar: adminAccount.avatarUrl, role: adminAccount.role || 'admin' };
    
    return null;
  }

  async populateMessage(msg: any) {
    if (!msg) return null;
    const sender = await this.getUserOrSellerOrAdmin(msg.sender);
    const receiver = await this.getUserOrSellerOrAdmin(msg.receiver);
    
    if (!sender || !receiver) return null;

    let replyTo = null;
    if (msg.replyTo) {
      let replyMsg = msg.replyTo;
      if (isValidObjectId(replyMsg) || typeof replyMsg === 'string') {
        replyMsg = await this.messageModel.findById(replyMsg).lean();
      }
      if (replyMsg) {
        replyTo = await this.populateMessage(replyMsg);
      }
    }

    return {
      ...msg,
      sender,
      receiver,
      replyTo,
    };
  }

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

  async saveMessage(senderId: string, dto: SendMessageDto): Promise<any> {
    const conversation = await this.getOrCreateConversation(senderId, dto.receiverId);

    const message = await this.messageModel.create({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(dto.receiverId),
      content: dto.content,
      attachmentUrl: dto.attachmentUrl,
      replyTo: dto.replyTo ? new Types.ObjectId(dto.replyTo) : undefined,
      conversation: conversation._id,
    });

    // update lastMessage (dynamic unreadCount will be calculated on the fly)
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
    });

    // Invalidate caches
    await this.cacheManager.del(`conv_list_${senderId}`);
    await this.cacheManager.del(`conv_list_${dto.receiverId}`);
    for(let i=1; i<=10; i++) {
      await this.cacheManager.del(`chat_${conversation._id}_${i}`);
    }

    const leanMessage = await this.messageModel.findById(message._id).lean();
    return this.populateMessage(leanMessage);
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 30,
  ) {
    // Authorization Check
    const conversation = await this.conversationModel.findById(conversationId).lean();
    if (!conversation) throw new NotFoundException('Conversation not found');
    const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new UnauthorizedException('You are not a participant in this conversation');
    }

    // Cache Check
    const cacheKey = `chat_${conversationId}_${page}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const messages = await this.messageModel
      .find({ conversation: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const result = (await Promise.all(messages.map((msg) => this.populateMessage(msg)))).filter((msg) => msg !== null);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async getUserConversations(userId: string) {
    const cacheKey = `conv_list_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const conversations = await this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
        deletedBy: { $ne: new Types.ObjectId(userId) }
      })
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();

    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await Promise.all(
          conv.participants.map((p) => this.getUserOrSellerOrAdmin(p))
        );

        if (participants.includes(null)) {
          return null;
        }

        let lastMessage = null;
        if (conv.lastMessage) {
          lastMessage = await this.populateMessage(conv.lastMessage);
        }

        // Dynamic Unread Count Calculation
        const unreadCount = await this.messageModel.countDocuments({
          conversation: conv._id,
          receiver: new Types.ObjectId(userId),
          isRead: false,
        });

        return {
          ...conv,
          unreadCount,
          participants,
          lastMessage,
        };
      })
    );

    const filteredConversations = populatedConversations.filter((c) => c !== null);
    await this.cacheManager.set(cacheKey, filteredConversations);
    return filteredConversations;
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

    await this.cacheManager.del(`conv_list_${userId}`);
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

    await message.save();

    // Invalidate caches
    await this.cacheManager.del(`conv_list_${userId}`);
    await this.cacheManager.del(`conv_list_${message.receiver.toString()}`);
    for(let i=1; i<=10; i++) {
      await this.cacheManager.del(`chat_${message.conversation.toString()}_${i}`);
    }

    return message;
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
    // Authorization Check
    const conversation = await this.conversationModel.findById(conversationId).lean();
    if (!conversation) throw new NotFoundException('Conversation not found');
    const isParticipant = conversation.participants.some((p) => p.toString() === userId.toString());
    if (!isParticipant) {
      throw new UnauthorizedException('You are not a participant in this conversation');
    }

    const messages = await this.messageModel
      .find({
        conversation: new Types.ObjectId(conversationId),
        content: { $regex: query, $options: 'i' },
        isDeleted: false
      })
      .sort({ createdAt: -1 })
      .lean();

    const populated = await Promise.all(messages.map((msg) => this.populateMessage(msg)));
    return populated.filter((msg) => msg !== null);
  }
}