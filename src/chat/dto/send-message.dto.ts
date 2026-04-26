import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'The ID of the user receiving the message', example: '60d5ecb8b392d7001f8e8e30' })
  @IsMongoId()
  receiverId: string;

  @ApiProperty({ description: 'The content of the message', example: 'Hello, how are you?', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}