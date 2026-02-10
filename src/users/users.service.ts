
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
} from '../auth/dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../auth/dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
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

    await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: 'user',
    });

    return { message: 'User registered successfully' };
  }

  // ================= Register Mobile =================
  async mobileRegister(dto: MobileSignUpDto) {
    const userExists = await this.userModel.findOne({
      $or: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (userExists) {
      throw new ConflictException('Email or phone already exists');
    }

    await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: dto.role,
    });

    return { message: 'User registered successfully' };
  }

  // ================= Login Website =================
  async websiteLogin(dto: WebsiteLoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // حفظ refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      message: 'User logged in successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ================= Login Mobile =================
  async mobileLogin(dto: MobileLoginDto) {
    return this.websiteLogin(dto);
  }

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
}
