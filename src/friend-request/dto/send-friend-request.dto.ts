import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFriendRequestDto {
  @ApiProperty({
    description: 'The MongoDB ObjectId of the user to send a friend request to',
    example: '665f1a2b3c4d5e6f7a8b9c0d',
  })
  @IsNotEmpty({ message: 'Receiver ID is required' })
  @IsMongoId({ message: 'Receiver ID must be a valid MongoDB ObjectId' })
  receiverId: string;
}
