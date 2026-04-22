import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { Roles } from 'src/auth/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/decorators/roles.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @Get('')
  findAll() {
    return this.adminService.findAll();
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard)
  @Get('my-profile')
  getMyProfile(@Request() req: any) {
    return this.adminService.getMyProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(id);
    return this.adminService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @Post('')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAdminDto) {
    return this.adminService.Login(dto);
  }
}
