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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { Roles } from 'src/auth/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/auth/decorators/roles.decorator';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@ApiTags('Admins')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all admins', description: 'Retrieves a list of all administrators' })
  @ApiResponse({ status: 200, description: 'List of admins retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Get('')
  findAll() {
    return this.adminService.findAll();
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile', description: 'Retrieves the profile of the currently logged-in admin' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('my-profile')
  getMyProfile(@Request() req: any) {
    return this.adminService.getMyProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an admin by ID', description: 'Retrieves details of a specific admin by their ID' })
  @ApiParam({ name: 'id', description: 'Admin ID', type: String })
  @ApiResponse({ status: 200, description: 'Admin details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(id);
    return this.adminService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an admin', description: 'Updates details of an existing admin' })
  @ApiParam({ name: 'id', description: 'Admin ID', type: String })
  @ApiBody({ type: UpdateAdminDto })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AccessTokenGuard, RolesGuard)
  @Role(Roles.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an admin', description: 'Removes an admin from the system' })
  @ApiParam({ name: 'id', description: 'Admin ID', type: String })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @ApiOperation({ summary: 'Create an admin', description: 'Creates a new administrator account' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @ApiOperation({ summary: 'Admin login', description: 'Authenticates an admin and returns a token' })
  @ApiBody({ type: LoginAdminDto })
  @ApiResponse({ status: 201, description: 'Logged in successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('login')
  login(@Body() dto: LoginAdminDto) {
    return this.adminService.Login(dto);
  }
}
