import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from '../auth/dto';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from 'src/auth/dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}
  // ================= Find All =================
  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password -refreshToken').lean();
  }

  // ================= Find One =================
  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password -refreshToken').lean();
  }

  // ================= Update =================
  // async update(id: string, dto: UpdateUserDto) {
  //   const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });
  //   if (!user) throw new NotFoundException('User not found');
  //   return { message: 'User updated successfully' };
  // }
  async update(id: string, dto: UpdateUserDto) {
    // delete dto.role;

    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });

    if (!user) throw new NotFoundException('User not found');

    return { message: 'User updated successfully' };
  }
  // ================= Remove =================
  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }
  // ================= Create Admin =================
  async createAdmin(dto: CreateAdminDto) {
    const existingUser = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingUser) {
      throw new NotFoundException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newAdmin = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
    });

    return {
      message: 'Admin created successfully',
    };
  }
}
