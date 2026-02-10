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

  // ================= Register Website =================
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

  // ================= Register Mobile =================
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

  // ================= Login Website =================
  async websiteLogin(dto: WebsiteLoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).select('+password');
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
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  // ================= Login Mobile =================

  async mobileLogin(dto: MobileLoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).select('+password');
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
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  // ================= Find All =================
  async findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .select('-password')
      .lean();
  }

  // // ================= Find By Email =================
  // async findByEmail(email: string): Promise<User | null> {
  //   return this.userModel
  //     .findOne({ email })
  //     .select('-password')
  //     .lean();
  // }

  // ================= Find One =================
  async findById(id: string): Promise<User | null> {
    return this.userModel
      .findById(id)
      .select('-password')
      .lean();
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
