import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Natural-language description of the project to generate',
    example: 'Build a full-stack todo app with React 18+ Vite and a Node.js API',
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({
    description: 'Target technology stack',
    example: 'React 18+ Vite',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  stack?: string;

  @ApiPropertyOptional({
    description: 'Thalorix user ID to associate this project with',
    example: '665f9c3b1e4b2a001f000001',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ description: 'Existing session ID to continue discussion' })
  @IsOptional()
  @IsString()
  session_id?: string;

  @ApiPropertyOptional({ description: 'Output preference, e.g. "files"' })
  @IsOptional()
  @IsString()
  output_preference?: string;
}
