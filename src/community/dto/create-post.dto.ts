import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The text content of the post', example: 'Hello World!' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'The ID of the user creating the post', example: '60d5ecb8b392d7001f8e8e30' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'URL of the image attached to the post', example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image?: string;
}