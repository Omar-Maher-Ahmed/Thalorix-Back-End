import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../auth/dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ================= Find All =================
  @ApiOperation({ summary: 'Get all users', description: 'Retrieves a paginated list of all users' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'limit', required: false, description: 'Number of users per page', type: Number, example: 10 })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-indexed)', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('')
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  // ================= Suggestions =================
  @ApiOperation({ summary: 'Get friend suggestions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('suggestions')
  getSuggestions(@Request() req: any) {
    return this.usersService.getSuggestions(req.user?.userId);
  }

  @ApiOperation({ summary: 'Get pending friend requests' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('friend-requests/pending')
  getPendingFriendRequests(@Request() req: any) {
    return this.usersService.getPendingFriendRequests(req.user?.userId);
  }

  // ================= Find One =================
  @ApiOperation({ summary: 'Get user by ID', description: 'Retrieves details of a specific user by ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // ================= Update =================
  @ApiOperation({ summary: 'Update user', description: 'Updates details of an existing user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(id, updateUserDto, req.user?.userId);
  }

  // ================= Remove =================
  @ApiOperation({ summary: 'Delete user', description: 'Removes a user from the system' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(id, req.user?.userId);
  }

  // ================= Social Connections =================

  @ApiOperation({ summary: 'Toggle Follow/Unfollow' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  toggleFollow(@Param('id') id: string, @Request() req: any) {
    return this.usersService.toggleFollow(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Get Relationship Status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/relationship')
  getRelationship(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getRelationship(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Send Friend Request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/friend-request')
  sendFriendRequest(@Param('id') id: string, @Request() req: any) {
    return this.usersService.sendFriendRequest(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Cancel Friend Request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/friend-request')
  cancelFriendRequest(@Param('id') id: string, @Request() req: any) {
    return this.usersService.cancelFriendRequest(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Accept Friend Request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/accept-friend')
  acceptFriendRequest(@Param('id') id: string, @Request() req: any) {
    return this.usersService.acceptFriendRequest(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Reject Friend Request' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reject-friend')
  rejectFriendRequest(@Param('id') id: string, @Request() req: any) {
    return this.usersService.rejectFriendRequest(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Block User' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/block')
  blockUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.blockUser(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Unblock User' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/unblock')
  unblockUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.unblockUser(req.user?.userId, id);
  }

  @ApiOperation({ summary: 'Get Friends' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/friends')
  getFriends(@Param('id') id: string) {
    return this.usersService.getFriends(id);
  }

  @ApiOperation({ summary: 'Get Followers' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @ApiOperation({ summary: 'Get Following' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }

  @ApiOperation({ summary: 'Get Mutual Friends' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/mutual-friends')
  getMutualFriends(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getMutualFriends(req.user?.userId, id);
  }

  // ================= Change Password =================
  @ApiOperation({ summary: 'Change Password', description: 'Change the password of an existing user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID', type: String })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/change-password')
  changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto, @Request() req: any) {
    return this.usersService.changePassword(id, changePasswordDto, req.user?.userId);
  }
}
