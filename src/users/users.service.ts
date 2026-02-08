import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { WebsiteSignUpDto, MobileSignUpDto, WebsiteLoginDto, MobileLoginDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async websiteRegister(websiteSignUpDto: WebsiteSignUpDto) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(websiteSignUpDto.password, salt);
    websiteSignUpDto.password = hash;
    return 'User registered successfully';
  }

  async mobileRegister(mobileSignUpDto: MobileSignUpDto) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(mobileSignUpDto.password, salt);
    mobileSignUpDto.password = hash;
    return 'User registered successfully';
  }

  async websiteLogin(websiteLoginDto: WebsiteLoginDto) {
    const user = await this.userRepository.findOne({
      where: {
        email: websiteLoginDto.email,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = await bcrypt.compare(websiteLoginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    return 'User logged in successfully';
  }

  async mobileLogin(mobileLoginDto: MobileLoginDto) {
    const user = await this.userRepository.findOne({
      where: {
        phone: mobileLoginDto.contact_number,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(mobileLoginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    return 'User logged in successfully';
  }

  findAll() {
    return `All users`;
  }

  findOne(id: number) {
    return `User with id: ${id}`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `User with id: ${id} updated successfully`;
  }

  remove(id: number) {
    return `User with id: ${id} deleted successfully`;
  }
}
