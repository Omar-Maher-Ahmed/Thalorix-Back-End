import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, WebsiteSignUpDto, MobileSignUpDto, MobileLoginDto, WebsiteLoginDto } from './dto';
import { SignupValidationPipe } from './pips/signup.validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('api/v1/web/register')
  websiteRegister(@Body(new SignupValidationPipe()) websiteSignUp: WebsiteSignUpDto) {
    return this.usersService.websiteRegister(websiteSignUp);
  }

  @Post('api/v1/mob/register')
  mobileRegister(@Body(new SignupValidationPipe()) mobileSignUp: MobileSignUpDto) {
    return this.usersService.mobileRegister(mobileSignUp);
  }

  @Post('api/v1/web/login')
  websiteLogin(@Body() websiteLogin: WebsiteLoginDto) {
    return this.usersService.websiteLogin(websiteLogin);
  }

  @Post('api/v1/mob/login')
  mobileLogin(@Body() mobileLogin: MobileLoginDto) {
    return this.usersService.mobileLogin(mobileLogin);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('api/v1/mob/me')
  findByEmail(@Body() body: { email: string }) {
    return this.usersService.findByEmail(body.email);
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
