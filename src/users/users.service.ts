import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  // ================= Utils =================
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // ================= Register =================
  async websiteRegister(dto: WebsiteSignUpDto) {
    const emailExists = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (emailExists) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: 'user',
    });

    await this.userRepository.save(user);

    return {
      message: 'User registered successfully',
    };
  }

  async mobileRegister(dto: MobileSignUpDto) {
    const userExists = await this.userRepository.findOne({
      where: [
        { email: dto.email },
        { phone: dto.phone },
      ],
    });

    if (userExists) {
      throw new ConflictException('Email or phone already exists');
    }

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      password: await this.hashPassword(dto.password),
      role: dto.role,
    });

    await this.userRepository.save(user);

    return {
      message: 'User registered successfully',
    };
  }

  // ================= Login =================
  async websiteLogin(dto: WebsiteLoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'User logged in successfully',
      userId: user.id,
    };
  }

  async mobileLogin(dto: MobileLoginDto) {
    const user = await this.userRepository.findOne({
      where: { phone: dto.contact_number },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      message: 'User logged in successfully',
      userId: user.id,
    };
  }

  async findAll() {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'phone', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  // ================= Find By Email =================
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  // ================= Find One =================
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'phone', 'role', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ================= Update =================
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, dto);

    await this.userRepository.save(user);

    return {
      message: 'User updated successfully',
    };
  }

  // ================= Remove =================
  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }
}
