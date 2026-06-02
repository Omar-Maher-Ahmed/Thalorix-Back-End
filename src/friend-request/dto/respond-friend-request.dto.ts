import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondFriendRequestDto {
  @ApiProperty({
    description: 'Accept or reject the friend request',
    enum: ['accepted', 'rejected'],
    example: 'accepted',
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(['accepted', 'rejected'], { message: 'Status must be either accepted or rejected' })
  status: 'accepted' | 'rejected';
}
