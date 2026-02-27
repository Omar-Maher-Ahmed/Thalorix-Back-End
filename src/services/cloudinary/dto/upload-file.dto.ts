import { IsString, IsOptional } from 'class-validator';

export class UploadFileDto {

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  description?: string;
}