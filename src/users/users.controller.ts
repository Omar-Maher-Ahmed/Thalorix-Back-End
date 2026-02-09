import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, WebsiteSignUpDto, MobileSignUpDto, MobileLoginDto, WebsiteLoginDto } from './dto';
import { SignupValidationPipe } from './pips/signup.validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('api/v1/web/register')
  websiteRegister(@Body(new SignupValidationPipe()) websiteSignUp: WebsiteSignUpDto) {
    return { message: 'User registered successfully', data: websiteSignUp };
  }

  @Post('api/v1/mob/register')
  mobileRegister(@Body(new SignupValidationPipe()) mobileSignUp: MobileSignUpDto) {
    return { message: 'User registered successfully', data: mobileSignUp };
  }

  @Post('api/v1/web/login')
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return { message: 'User logged in successfully', data: websiteLogin };
  }

  @Post('api/v1/mob/login')
  mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return { message: 'User logged in successfully', data: mobileLogin };
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
