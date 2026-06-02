import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FriendRequestService } from './friend-request.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { JwtAuthGuard } from '../auth/token/jwt-auth.guard';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

@ApiTags('Friend Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccessTokenGuard)
@Controller('friend-requests')
export class FriendRequestController {
  constructor(private readonly friendRequestService: FriendRequestService) {}

  // ─────────────────────────────────────────
  // Send Request
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Send a friend request' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({ status: 201, description: 'Friend request sent successfully.' })
  @ApiResponse({ status: 400, description: 'Already friends / pending request exists / cannot send to self.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  async sendRequest(@Request() req: any, @Body() dto: SendFriendRequestDto) {
    return this.friendRequestService.sendRequest(req.user.userId, dto);
  }

  // ─────────────────────────────────────────
  // Get Pending Incoming Requests
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Get all incoming pending friend requests' })
  @ApiResponse({ status: 200, description: 'List of pending incoming requests.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('pending')
  async getPendingRequests(@Request() req: any) {
    return this.friendRequestService.getPendingRequests(req.user.userId);
  }

  // ─────────────────────────────────────────
  // Get Sent Requests
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Get all sent (outgoing) pending friend requests' })
  @ApiResponse({ status: 200, description: 'List of sent pending requests.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('sent')
  async getSentRequests(@Request() req: any) {
    return this.friendRequestService.getSentRequests(req.user.userId);
  }

  // ─────────────────────────────────────────
  // Get Friends List
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Get my friends list' })
  @ApiResponse({ status: 200, description: 'List of accepted friends.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('friends')
  async getFriends(@Request() req: any) {
    return this.friendRequestService.getFriends(req.user.userId);
  }

  // ─────────────────────────────────────────
  // Respond to a Request (Accept / Reject)
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Accept or reject a friend request' })
  @ApiParam({ name: 'id', description: 'Friend request MongoDB ObjectId' })
  @ApiBody({ type: RespondFriendRequestDto })
  @ApiResponse({ status: 200, description: 'Friend request accepted or rejected.' })
  @ApiResponse({ status: 400, description: 'Request already responded to.' })
  @ApiResponse({ status: 403, description: 'Forbidden — only the receiver can respond.' })
  @ApiResponse({ status: 404, description: 'Friend request not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Patch(':id/respond')
  async respondToRequest(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return this.friendRequestService.respondToRequest(id, req.user.userId, dto);
  }

  // ─────────────────────────────────────────
  // Cancel Sent Request
  // ─────────────────────────────────────────

  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiParam({ name: 'id', description: 'Friend request MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Friend request cancelled successfully.' })
  @ApiResponse({ status: 400, description: 'Request is not pending.' })
  @ApiResponse({ status: 403, description: 'Forbidden — only the sender can cancel.' })
  @ApiResponse({ status: 404, description: 'Friend request not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete(':id')
  async cancelRequest(@Param('id') id: string, @Request() req: any) {
    return this.friendRequestService.cancelRequest(id, req.user.userId);
  }
}
