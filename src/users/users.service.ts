import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from '../auth/dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AuditLogService } from '../audit/audit-log.service';
import { FriendRequest } from '../friend-request/schema/friend-request.schema';
import { Seller } from '../sellers/schema/seller.schema';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(FriendRequest.name)
    private readonly friendRequestModel: Model<FriendRequest>,
    @InjectModel(Seller.name)
    private readonly sellerModel: Model<Seller>,
    private readonly auditLogService: AuditLogService,
    private readonly jwtService: JwtService,
  ) { }

  // ================= Find All =================
  async findAll(query: QueryUserDto): Promise<{ data: User[]; total: number }> {
    const { limit = 10, page = 1 } = query;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).skip(skip).select('-password').lean(),
      this.userModel.countDocuments({ isDeleted: { $ne: true } }),
    ]);

    return {
      total,
      data,
    };
  }

  // ================= Find One =================
  async findById(id: string): Promise<User | null> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findOne({ _id: id, isDeleted: { $ne: true } }).select('-password').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // ================= Update =================
  async update(id: string, dto: UpdateUserDto, requesterId?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid User ID format');
    }

    if (requesterId && requesterId.toString() === id) {
      if (dto.role && dto.role !== 'admin') {
        throw new BadRequestException('You cannot demote yourself from Admin role');
      }
      if (dto.isBlocked === true) {
        throw new BadRequestException('You cannot block your own admin account');
      }
    }

    const oldUser = await this.userModel.findOne({ _id: id, isDeleted: { $ne: true } }).lean();
    if (!oldUser) throw new NotFoundException('User not found');

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after', new: true, runValidators: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');

    // Audit log if modified by an admin
    if (requesterId) {
      if (dto.role && dto.role !== oldUser.role) {
        await this.auditLogService.logAction(requesterId, id, 'ADMIN_PROMOTE_ROLE', 'USER', {
          oldRole: oldUser.role,
          newRole: dto.role,
        });
      }
      if (dto.isBlocked !== undefined && dto.isBlocked !== oldUser.isBlocked) {
        await this.auditLogService.logAction(
          requesterId,
          id,
          dto.isBlocked ? 'ADMIN_BLOCK_USER' : 'ADMIN_UNBLOCK_USER',
          'USER',
        );
      }
    }

    return {
      message: 'User updated successfully',
      user,
    };
  }

  // ================= Change Password =================
  async changePassword(id: string, dto: ChangePasswordDto, requesterId?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid User ID format');
    }

    if (requesterId && requesterId.toString() !== id) {
      throw new UnauthorizedException('You can only change your own password');
    }

    const user = await this.userModel.findOne({ _id: id, isDeleted: { $ne: true } }).select('+password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.password) {
      throw new BadRequestException('User does not have a password set');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      jti: crypto.randomBytes(16).toString('hex'),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_SECRET,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const hashedCurrentAccessToken = await bcrypt.hash(accessToken, 10);

    await this.userModel.updateOne(
      { _id: id },
      { 
        $set: {
          password: hashedPassword,
          currentAccessToken: hashedCurrentAccessToken,
          refreshToken: hashedRefreshToken,
        },
        $inc: { tokenVersion: 1 }
      }
    );

    return { 
      message: 'Password changed successfully',
      accessToken,
      refreshToken
    };
  }

  // ================= Remove =================
  async remove(id: string, requesterId?: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid User ID format');
    }
    if (requesterId && requesterId.toString() === id) {
      throw new BadRequestException('You cannot delete your own admin account');
    }
    const user = await this.userModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true } },
      { returnDocument: 'after' }
    );
    if (!user) throw new NotFoundException('User not found');

    if (requesterId) {
      await this.auditLogService.logAction(requesterId, id, 'ADMIN_DELETE_USER', 'USER');
    }

    return { message: 'User deleted successfully' };
  }

  // ================= Social Connections =================

  async toggleFollow(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    if (requesterId === targetId) throw new BadRequestException('Cannot follow yourself');

    let target: any = await this.userModel.findById(targetId);
    let isSeller = false;

    if (!target) {
      target = await this.sellerModel.findById(targetId);
      if (!target) throw new NotFoundException('User or Seller not found');
      isSeller = true;
    }

    const requester = await this.userModel.findById(requesterId);
    if (!requester) {
      throw new BadRequestException('Only standard users can follow profiles or stores');
    }

    const isFollowing = requester.following.some(id => id.toString() === targetId);

    if (isFollowing) {
      await this.userModel.findByIdAndUpdate(requesterId, {
        $pull: { following: new Types.ObjectId(targetId) },
        $inc: { followingCount: -1 }
      });
      if (isSeller) {
        await this.sellerModel.findByIdAndUpdate(targetId, {
          $pull: { followers: new Types.ObjectId(requesterId) },
          $inc: { followersCount: -1 }
        });
      } else {
        await this.userModel.findByIdAndUpdate(targetId, {
          $pull: { followers: new Types.ObjectId(requesterId) },
          $inc: { followersCount: -1 }
        });
      }
      return { message: 'Unfollowed successfully' };
    } else {
      await this.userModel.findByIdAndUpdate(requesterId, {
        $addToSet: { following: new Types.ObjectId(targetId) },
        $inc: { followingCount: 1 }
      });
      if (isSeller) {
        await this.sellerModel.findByIdAndUpdate(targetId, {
          $addToSet: { followers: new Types.ObjectId(requesterId) },
          $inc: { followersCount: 1 }
        });
      } else {
        await this.userModel.findByIdAndUpdate(targetId, {
          $addToSet: { followers: new Types.ObjectId(requesterId) },
          $inc: { followersCount: 1 }
        });
      }
      return { message: 'Followed successfully' };
    }
  }

  async getRelationship(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    const requester = await this.userModel.findById(requesterId).lean();
    if (!requester) {
      // If the requester is an Admin or guest, they don't have standard social relationships
      return {
        isFollowing: false,
        isFriend: false,
        isBlocked: false,
        requestSent: false,
        requestReceived: false,
      };
    }

    const reqObjId = new Types.ObjectId(requesterId);
    const targetObjId = new Types.ObjectId(targetId);

    const isFollowing = requester.following.some(id => id.equals(targetObjId));
    const isFriend = requester.friends.some(id => id.equals(targetObjId));
    const isBlocked = requester.blockedUsers.some(id => id.equals(targetObjId));

    const sentReq = await this.friendRequestModel.findOne({ senderId: reqObjId, receiverId: targetObjId, status: 'pending' }).lean();
    const receivedReq = await this.friendRequestModel.findOne({ senderId: targetObjId, receiverId: reqObjId, status: 'pending' }).lean();

    return {
      isFollowing,
      isFriend,
      isBlocked,
      requestSent: !!sentReq,
      requestReceived: !!receivedReq,
    };
  }

  async sendFriendRequest(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    if (requesterId === targetId) throw new BadRequestException('Cannot send friend request to yourself');

    const target = await this.userModel.findById(targetId);
    if (!target) throw new NotFoundException('User not found');

    const reqObjId = new Types.ObjectId(requesterId);
    const targetObjId = new Types.ObjectId(targetId);

    if (target.friends.some(id => id.equals(reqObjId))) {
      throw new BadRequestException('Already friends');
    }

    try {
      await this.friendRequestModel.create({
        senderId: reqObjId,
        receiverId: targetObjId,
        status: 'pending'
      });
      return { message: 'Friend request sent' };
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Friend request already pending');
      }
      throw error;
    }
  }

  async cancelFriendRequest(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    const reqObjId = new Types.ObjectId(requesterId);
    const targetObjId = new Types.ObjectId(targetId);

    const result = await this.friendRequestModel.findOneAndDelete({ senderId: reqObjId, receiverId: targetObjId, status: 'pending' });
    if (!result) throw new NotFoundException('Friend request not found');

    return { message: 'Friend request cancelled' };
  }

  async acceptFriendRequest(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    const reqObjId = new Types.ObjectId(requesterId);
    const targetObjId = new Types.ObjectId(targetId);

    const request = await this.friendRequestModel.findOneAndUpdate(
      { senderId: targetObjId, receiverId: reqObjId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );

    if (!request) throw new NotFoundException('Friend request not found');

    await this.userModel.findByIdAndUpdate(requesterId, {
      $addToSet: { friends: targetId },
      $inc: { friendsCount: 1 }
    });

    await this.userModel.findByIdAndUpdate(targetId, {
      $addToSet: { friends: requesterId },
      $inc: { friendsCount: 1 }
    });

    return { message: 'Friend request accepted' };
  }

  async rejectFriendRequest(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    const reqObjId = new Types.ObjectId(requesterId);
    const targetObjId = new Types.ObjectId(targetId);

    const request = await this.friendRequestModel.findOneAndUpdate(
      { senderId: targetObjId, receiverId: reqObjId, status: 'pending' },
      { status: 'rejected' },
      { new: true }
    );

    if (!request) throw new NotFoundException('Friend request not found');

    return { message: 'Friend request rejected' };
  }

  async blockUser(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    if (requesterId === targetId) throw new BadRequestException('Cannot block yourself');

    await this.userModel.findByIdAndUpdate(requesterId, {
      $addToSet: { blockedUsers: targetId },
      $pull: { friends: targetId, following: targetId, followers: targetId }
    });

    await this.userModel.findByIdAndUpdate(targetId, {
      $pull: { friends: requesterId, following: requesterId, followers: requesterId }
    });

    return { message: 'User blocked' };
  }

  async unblockUser(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    await this.userModel.findByIdAndUpdate(requesterId, {
      $pull: { blockedUsers: targetId }
    });
    return { message: 'User unblocked' };
  }

  async getFriends(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException('Invalid ID');
    const user = await this.userModel.findById(userId).populate('friends', 'name avatarUrl username').lean();
    if (!user) throw new NotFoundException('User not found');
    return user.friends;
  }

  async getFollowers(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException('Invalid ID');
    const user = await this.userModel.findById(userId).populate('followers', 'name avatarUrl username').lean();
    if (!user) throw new NotFoundException('User not found');
    return user.followers;
  }

  async getFollowing(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException('Invalid ID');
    const user = await this.userModel.findById(userId).populate('following', 'name avatarUrl username').lean();
    if (!user) throw new NotFoundException('User not found');
    return user.following;
  }

  async getMutualFriends(requesterId: string, targetId: string) {
    if (!isValidObjectId(targetId) || !isValidObjectId(requesterId)) throw new BadRequestException('Invalid ID');
    const requester = await this.userModel.findById(requesterId).lean();
    const target = await this.userModel.findById(targetId).lean();
    if (!requester || !target) throw new NotFoundException('User not found');

    const reqFriends = requester.friends.map(id => id.toString());
    const targetFriends = target.friends.map(id => id.toString());
    const mutual = reqFriends.filter(id => targetFriends.includes(id));

    const mutualFriends = await this.userModel.find({ _id: { $in: mutual } }).select('name avatarUrl username').lean();
    return mutualFriends;
  }

  async getSuggestions(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException('Invalid ID');
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const excludeIds = [
      new Types.ObjectId(userId),
      ...user.friends,
      ...user.following,
      ...user.blockedUsers
    ];

    const suggestions = await this.userModel.aggregate([
      { $match: { _id: { $nin: excludeIds }, isDeleted: { $ne: true } } },
      { $sample: { size: 5 } },
      { $project: { name: 1, avatarUrl: 1, username: 1, followersCount: 1 } }
    ]);

    return suggestions;
  }

  async getPendingFriendRequests(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException('Invalid ID');
    const reqObjId = new Types.ObjectId(userId);
    return this.friendRequestModel
      .find({ receiverId: reqObjId, status: 'pending' })
      .populate('senderId', 'name avatarUrl username')
      .lean();
  }

  // ================= Blocked Users =================
  async getBlockedUsers(userId: string) {
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException('Invalid or missing user ID');
    }

    const user = await this.userModel
      .findOne({ _id: new Types.ObjectId(userId), isDeleted: { $ne: true } })
      .populate('blockedUsers', 'name avatarUrl username email')
      .lean();

    if (!user) throw new NotFoundException('User not found');

    const blockedUsers = user.blockedUsers ?? [];

    return {
      total: blockedUsers.length,
      data: blockedUsers,
    };
  }
}
