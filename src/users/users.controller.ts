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
import { UpdateUserDto } from '../auth/dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ================= Find All =================
  @UseGuards(JwtAuthGuard)
  @Get('')
  findAll() {
    return this.usersService.findAll();
  }

  // ================= Find One =================
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // ================= Update =================
  @UseGuards(JwtAuthGuard, AccessTokenGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // ================= Remove =================
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
