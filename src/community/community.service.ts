

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { PostLike, PostLikeDocument } from './schemas/post-like.schema';

import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(PostLike.name) private postLikeModel: Model<PostLikeDocument>,
  ) { }

  // 🟢 Create Post
  async createPost(dto: CreatePostDto) {
    return this.postModel.create({
      userId: dto.userId,
      content: dto.content,
      image: dto.image,
    });
  }

  // 🟢 Feed
  async getFeed(currentUserId?: string) {
    const posts = await this.postModel.find().sort({ createdAt: -1 }).lean();

    if (currentUserId && Types.ObjectId.isValid(currentUserId)) {
      const userLikes = await this.postLikeModel.find({
        userId: new Types.ObjectId(currentUserId),
      }).select('postId').lean();

      const likedPostIds = new Set(userLikes.map((like) => like.postId.toString()));

      return posts.map((post) => ({
        ...post,
        liked: likedPostIds.has((post as any)._id.toString()),
      }));
    }

    return posts;
  }

  // 🟢 Top Posts
  async getTopPosts() {
    return this.postModel.find().sort({ likesCount: -1 }).limit(5);
  }

  // 🟢 Update Post
  async updatePost(postId: string, dto: CreatePostDto) {
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      {
        content: dto.content,
        image: dto.image,
      },
      { new: true },
    );

    if (!post) throw new NotFoundException('Post not found');

    return post;
  }

  // 🟢 Delete Post
  async deletePost(postId: string) {
    const post = await this.postModel.findByIdAndDelete(postId);

    if (!post) throw new NotFoundException('Post not found');

    // نحذف الكومنتات المرتبطة بيه
    await this.commentModel.deleteMany({ postId });

    return { message: 'Post deleted' };
  }

  // 🟢 Add Comment
  async addComment(postId: string, dto: CreateCommentDto) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    await this.commentModel.create({
      postId,
      userId: dto.userId,
      content: dto.content,
    });

    // نزود العداد
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    return { message: 'Comment added' };
  }

  // 🟢 Get Comments
  async getComments(postId: string) {
    return this.commentModel
      .find({ postId })
      .sort({ createdAt: -1 });
  }

  // 🟢 Update Comment
  async updateComment(commentId: string, dto: CreateCommentDto) {
    const comment = await this.commentModel.findByIdAndUpdate(
      commentId,
      {
        content: dto.content,
      },
      { new: true },
    );

    if (!comment) throw new NotFoundException('Comment not found');

    return comment;
  }

  // 🟢 Delete Comment
  async deleteComment(commentId: string) {
    const comment = await this.commentModel.findByIdAndDelete(commentId);

    if (!comment) throw new NotFoundException('Comment not found');

    // نقلل عداد الكومنتات
    await this.postModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCount: -1 },
    });

    return { message: 'Comment deleted' };
  }

  // 🟢 Toggle Like Post
  async toggleLike(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.postLikeModel.findOne({
      userId: new Types.ObjectId(userId),
      postId: new Types.ObjectId(postId),
    });

    if (existingLike) {
      // Unlike
      await this.postLikeModel.findByIdAndDelete(existingLike._id);
      await this.postModel.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      });
      return { liked: false, message: 'Post unliked successfully' };
    } else {
      // Like
      await this.postLikeModel.create({
        userId: new Types.ObjectId(userId),
        postId: new Types.ObjectId(postId),
      });
      await this.postModel.findByIdAndUpdate(postId, {
        $inc: { likesCount: 1 },
      });
      return { liked: true, message: 'Post liked successfully' };
    }
  }

  // 🟢 Get Likes on a Post
  async getLikes(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const likes = await this.postLikeModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('userId', 'name username avatarUrl avatar logo role')
      .lean();

    return likes.map((like: any) => ({
      id: like._id,
      user: {
        id: like.userId?._id || like.userId?.id,
        name: like.userId?.name || like.userId?.username || 'User',
        avatar: like.userId?.avatarUrl || like.userId?.avatar || like.userId?.logo || '/images/avatar.png',
        role: like.userId?.role || 'user',
      }
    }));
  }
}