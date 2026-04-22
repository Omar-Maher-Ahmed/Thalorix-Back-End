import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';

import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
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
  async getFeed() {
    return this.postModel.find().sort({ createdAt: -1 });
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
}