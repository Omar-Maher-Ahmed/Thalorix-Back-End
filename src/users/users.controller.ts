import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../auth/dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { QueryUserDto } from './dto/query-user.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ================= Find All =================
  @UseGuards(JwtAuthGuard)
  @Get('')
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
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
  @UseGuards(JwtAuthGuard, AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
