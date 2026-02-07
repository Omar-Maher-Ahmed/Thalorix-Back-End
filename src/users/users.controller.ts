import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { WebsiteSignUpDto, MobileSignUpDto } from './dto/auth.dto';
import { WebsiteLoginDto, MobileLoginDto } from './dto/auth.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('api/v1/web/register')
  websiteRegister(@Body() WebsiteSignUpDto: WebsiteSignUpDto) {
    return { message: 'User registered successfully', data: WebsiteSignUpDto };
  }

  @Post('api/v1/mob/register')
  mobileRegister(@Body() MobileSignUpDto: MobileSignUpDto) {
    return { message: 'User registered successfully', data: MobileSignUpDto };
  }

  @Post('api/v1/web/login')
  websiteLogin(@Body() WebsiteLoginDto: WebsiteLoginDto) {
    return { message: 'User logged in successfully', data: WebsiteLoginDto };
  }

  @Post('api/v1/mob/login')
  mobileLogin(@Body() MobileLoginDto: MobileLoginDto) {
    return { message: 'User logged in successfully', data: MobileLoginDto };
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
