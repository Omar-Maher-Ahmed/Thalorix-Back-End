import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import {
  WebsiteSignUpDto,
  MobileSignUpDto,
  WebsiteLoginDto,
  MobileLoginDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  // ================= Utils =================
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // ================= Register =================
  async websiteRegister(dto: WebsiteSignUpDto) {

    const emailExists = await this.userModel.exists({ email: dto.email });
    if (emailExists) {
      throw new ConflictException('Email already exists');
    }
    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: 'user',
    });

    return {
      message: 'User registered successfully',
    };
  }
  async mobileRegister(dto: MobileSignUpDto) {
    const userExists = await this.userModel.findOne({
      $or: [
        { email: dto.email },
        { phone: dto.phone },
      ],
    });

    if (userExists) {
      throw new ConflictException('Email or phone already exists');
    }

    const createdUser = new this.userModel({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: dto.role,
    });

    await createdUser.save();

    return {
      message: 'User registered successfully',
    };
  }

  // ================= Login =================
  async websiteLogin(dto: WebsiteLoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'User logged in successfully',
      userId: user._id,
    };
  }

  async mobileLogin(dto: MobileLoginDto) {
    const user = await this.userModel.findOne({ phone: dto.contact_number });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'User logged in successfully',
      userId: user._id,
    };
  }

  // ================= Find All =================
  async findAll() {
    return this.userModel.find();
  }

  // ================= Find By Email =================
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  // ================= Find One =================
  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('name email phone role createdAt');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ================= Update =================
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User updated successfully',
    };
  }

  // ================= Remove =================
  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
    };
  }
}
