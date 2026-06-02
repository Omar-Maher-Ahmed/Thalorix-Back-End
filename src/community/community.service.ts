

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
    const modelName = dto.userRole ? dto.userRole.charAt(0).toUpperCase() + dto.userRole.slice(1) : 'User';
    const post = await this.postModel.create({
      userId: new Types.ObjectId(dto.userId),
      userModel: modelName,
      content: dto.content,
      image: dto.image,
      link: dto.link,
    });
    return post?.populate('userId', 'name avatarUrl role bio');
  }

  // 🟢 Feed
  async getFeed(userId?: string) {
    const posts = await this.postModel.find().populate('userId', 'name avatarUrl role bio').sort({ createdAt: -1 }).lean();
    if (userId) {
      const likedPostIds = await this.postLikeModel.find({ userId: new Types.ObjectId(userId) }).distinct('postId');
      const likedPostStrings = likedPostIds.map(id => id.toString());
      return posts.map(post => ({
        ...post,
        liked: likedPostStrings.includes(post._id.toString())
      }));
    }
    return posts;
  }

  // 🟢 Update Post
  async updatePost(postId: string, dto: CreatePostDto) {
    const post = await this.postModel.findByIdAndUpdate(
      postId,
      {
        content: dto.content,
        image: dto.image,
        link: dto.link,
      },
      { returnDocument: 'after', new: true },
    );

    if (!post) throw new NotFoundException('Post not found');

    return post;
  }

  // 🟢 Delete Post
  async deletePost(postId: string) {
    const post = await this.postModel.findByIdAndDelete(postId);

    if (!post) throw new NotFoundException('Post not found');

    // نحذف الكومنتات المرتبطة بيه
    await this.commentModel.deleteMany({ postId: new Types.ObjectId(postId) });

    return { message: 'Post deleted' };
  }

  // 🟢 Add Comment
  async addComment(postId: string, dto: CreateCommentDto) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const modelName = dto.userRole ? dto.userRole.charAt(0).toUpperCase() + dto.userRole.slice(1) : 'User';
    const comment = await this.commentModel.create({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(dto.userId),
      userModel: modelName,
      content: dto.content,
    });

    // نزود العداد
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    return comment?.populate('userId', 'name avatarUrl role bio');
  }

  // 🟢 Get Comments
  async getComments(postId: string) {
    return this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('userId', 'name avatarUrl role bio')
      .sort({ createdAt: -1 });
  }

  // 🟢 Update Comment
  async updateComment(commentId: string, dto: CreateCommentDto) {
    const comment = await this.commentModel.findByIdAndUpdate(
      commentId,
      {
        content: dto.content,
      },
      { returnDocument: 'after', new: true },
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

  // 🟢 Toggle Like
  async toggleLike(postId: string, userId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const existingLike = await this.postLikeModel.findOne({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    });

    if (existingLike) {
      // Unlike
      await this.postLikeModel.findByIdAndDelete(existingLike._id);
      await this.postModel.findByIdAndUpdate(postId, {
        $inc: { likesCount: -1 },
      });
      return { liked: false, likesCount: post.likesCount - 1 };
    } else {
      // Like
      await this.postLikeModel.create({
        postId: new Types.ObjectId(postId),
        userId: new Types.ObjectId(userId),
      });
      await this.postModel.findByIdAndUpdate(postId, {
        $inc: { likesCount: 1 },
      });
      return { liked: true, likesCount: post.likesCount + 1 };
    }
  }
}