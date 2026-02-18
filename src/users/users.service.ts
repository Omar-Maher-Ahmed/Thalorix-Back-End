import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import {
  UpdateUserDto,
  ForgotPasswordDto,
} from '../auth/dto';
import { MailService } from '../services/mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly mailService: MailService,
  ) { }
  // ================= Find All =================
  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password -refreshToken').lean();
  }

  // ================= Find One =================
  async findById(id: string): Promise<User | null> {
    return this.userModel
      .findById(id)
      .select('-password -refreshToken')
      .lean();
  }

  // ================= Update =================
  async update(id: string, dto: UpdateUserDto) {
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

  // ================= Forgot Password =================
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiration

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    await this.mailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Password reset email sent' };
  }
}
