import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from '../admin/schema/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import * as bcrypt from 'bcrypt';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel: Model<Admin>,
  ) {}

  async findAll(): Promise<Admin[]> {
    return this.adminModel.find().select('-password').lean();
  }

  // ================= Find One =================
  async findById(id: string): Promise<Admin | null> {
    return this.adminModel.findById(id).select('-password').lean();
  }

  // ================= Update =================
  async update(id: string, dto: UpdateAdminDto) {
    const user = await this.adminModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!user) throw new NotFoundException('User not found');

    return { message: 'User updated successfully' };
  }
  // ================= Remove =================
  async remove(id: string) {
    const user = await this.adminModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  // ================= Create Admin =================
  async createAdmin(dto: CreateAdminDto) {
    const existingUser = await this.adminModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingUser) {
      throw new NotFoundException('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newAdmin = await this.adminModel.create({
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
