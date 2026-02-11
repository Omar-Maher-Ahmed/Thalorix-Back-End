
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import {
  UpdateUserDto,
  WebsiteSignUpDto,
  MobileSignUpDto,
  MobileLoginDto,
  WebsiteLoginDto,
} from '../auth/dto';

import { SignupValidationPipe } from '../auth/pips/signup.validation.pipe';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { Roles } from 'src/auth/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // ================= Public Routes =================

  @Post('api/v1/web/register')
  websiteRegister(
    @Body(new SignupValidationPipe()) websiteSignUp: WebsiteSignUpDto,
  ) {
    return this.usersService.websiteRegister(websiteSignUp);
  }

  @Post('api/v1/mob/register')
  mobileRegister(
    @Body(new SignupValidationPipe()) mobileSignUp: MobileSignUpDto,
  ) {
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

  // ================= Protected Routes =================

  @UseGuards(JwtAuthGuard)
  @Get('api/v1/all')
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('api/v1/:id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('api/v1/:id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Role(Roles.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
