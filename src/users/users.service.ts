import { Injectable } from '@nestjs/common';
import { WebsiteSignUpDto, MobileSignUpDto, WebsiteLoginDto, MobileLoginDto } from './dto/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  websiteRegister(WebsiteSignUpDto: WebsiteSignUpDto) {
    return 'This action adds a new user';
  }

  mobileRegister(MobileSignUpDto: MobileSignUpDto) {
    return 'This action adds a new user';
  }

  websiteLogin(WebsiteLoginDto: WebsiteLoginDto) {
    return 'This action adds a new user';
  }

  mobileLogin(MobileLoginDto: MobileLoginDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
