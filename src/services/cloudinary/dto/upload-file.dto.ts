import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {

  @ApiProperty({ description: 'The folder slug to upload the file to', example: 'avatars' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Alt text for the image', example: 'User avatar' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'Description of the file' })
  @IsOptional()
  @IsString()
  description?: string;
}