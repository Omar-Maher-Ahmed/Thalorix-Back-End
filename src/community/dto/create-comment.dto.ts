import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'The content of the comment', example: 'This is a great post!' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'The ID of the user creating the comment', example: '60d5ecb8b392d7001f8e8e30' })
  @IsString()
  userId: string; // مؤقت زي البوست
}