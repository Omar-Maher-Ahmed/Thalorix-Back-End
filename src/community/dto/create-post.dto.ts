
import { IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  content: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  image?: string;
}