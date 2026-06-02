import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from '../auth/dto';
import { QueryUserDto } from './dto/query-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}
  // ================= Find All =================
  async findAll(query: QueryUserDto): Promise<{ data: User[]; total: number }> {
    const { limit = 10, page = 1 } = query;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().limit(limit).skip(skip).select('-password').lean(),
      this.userModel.countDocuments(),
    ]);

    return {
      total,
      data,
    };
  }

  // ================= Find One =================
  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').lean();
  }

  // ================= Update =================
  async update(id: string, dto: UpdateUserDto) {
    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return {
      message: 'User updated successfully',
      user,
    };
  }
  // ================= Remove =================
  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid User ID format');
    }
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }
}
