import { Injectable } from '@nestjs/common';
import { WebsiteSignUpDto, MobileSignUpDto, WebsiteLoginDto, MobileLoginDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
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

  websiteLogin(WebsiteLoginDto: WebsiteLoginDto) {
    return 'User logged in successfully';
  }

  mobileLogin(MobileLoginDto: MobileLoginDto) {
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
