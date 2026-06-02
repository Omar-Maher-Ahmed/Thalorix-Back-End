import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FriendRequest } from './schema/friend-request.schema';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectModel(FriendRequest.name)
    private readonly friendRequestModel: Model<FriendRequest>,
  ) {}

  // ================= Send Friend Request =================
  async sendRequest(senderId: string, dto: SendFriendRequestDto) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    // Check if a pending request already exists (either direction)
    const existing = await this.friendRequestModel.findOne({
      $or: [
        { senderId: new Types.ObjectId(senderId), receiverId: new Types.ObjectId(dto.receiverId), status: 'pending' },
        { senderId: new Types.ObjectId(dto.receiverId), receiverId: new Types.ObjectId(senderId), status: 'pending' },
      ],
    });

    if (existing) {
      throw new BadRequestException('A pending friend request already exists between you and this user');
    }

    // Check if already friends (accepted)
    const alreadyFriends = await this.friendRequestModel.findOne({
      $or: [
        { senderId: new Types.ObjectId(senderId), receiverId: new Types.ObjectId(dto.receiverId), status: 'accepted' },
        { senderId: new Types.ObjectId(dto.receiverId), receiverId: new Types.ObjectId(senderId), status: 'accepted' },
      ],
    });

    if (alreadyFriends) {
      throw new BadRequestException('You are already friends with this user');
    }

    await this.friendRequestModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(dto.receiverId),
    });

    return { message: 'Friend request sent successfully' };
  }

  // ================= Respond to Friend Request =================
  async respondToRequest(requestId: string, userId: string, dto: RespondFriendRequestDto) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the receiver can accept or reject
    if (request.receiverId.toString() !== userId) {
      throw new ForbiddenException('You are not authorized to respond to this request');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('This request has already been responded to');
    }

    request.status = dto.status;
    await request.save();

    return {
      message: dto.status === 'accepted'
        ? 'Friend request accepted'
        : 'Friend request rejected',
    };
  }

  // ================= Get Pending (Incoming) Requests =================
  async getPendingRequests(userId: string) {
    const requests = await this.friendRequestModel
      .find({ receiverId: new Types.ObjectId(userId), status: 'pending' })
      .populate('senderId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    return { data: requests, total: requests.length };
  }

  // ================= Get Sent Requests =================
  async getSentRequests(userId: string) {
    const requests = await this.friendRequestModel
      .find({ senderId: new Types.ObjectId(userId), status: 'pending' })
      .populate('receiverId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    return { data: requests, total: requests.length };
  }

  // ================= Cancel Sent Request =================
  async cancelRequest(requestId: string, senderId: string) {
    const request = await this.friendRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (request.senderId.toString() !== senderId) {
      throw new ForbiddenException('You are not authorized to cancel this request');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    await this.friendRequestModel.findByIdAndDelete(requestId);

    return { message: 'Friend request cancelled successfully' };
  }

  // ================= Get Friends List =================
  async getFriends(userId: string) {
    const accepted = await this.friendRequestModel
      .find({
        $or: [
          { senderId: new Types.ObjectId(userId), status: 'accepted' },
          { receiverId: new Types.ObjectId(userId), status: 'accepted' },
        ],
      })
      .populate('senderId', 'name email avatarUrl')
      .populate('receiverId', 'name email avatarUrl')
      .sort({ updatedAt: -1 })
      .lean();

    // Return the other user's info (not the requester)
    const friends = accepted.map((req) => {
      const isSender = req.senderId._id?.toString() === userId ||
        req.senderId.toString() === userId;
      return isSender ? req.receiverId : req.senderId;
    });

    return { data: friends, total: friends.length };
  }
}
