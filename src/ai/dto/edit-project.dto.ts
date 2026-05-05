import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditProjectDto {
  @ApiProperty({
    description: 'Edit instruction to send using the existing project session',
    example: 'Add a dark mode toggle to the header',
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;
}
