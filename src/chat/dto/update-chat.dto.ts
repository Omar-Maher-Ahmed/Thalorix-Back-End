import { PartialType } from '@nestjs/swagger';
import { CreateChatDto } from './create-chat.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChatDto extends PartialType(CreateChatDto) {
  @ApiProperty({ description: 'The chat ID' })
  id: number;
}
