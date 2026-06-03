import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsOptional,
  IsNumberString,
  Matches,
  IsArray,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpertiseDto, SocialLinksDto } from '../../auth/dto/update-user.dto';

export class UpdateAdminDto {
  @ApiPropertyOptional({ description: 'The email address of the admin', example: 'admin@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ description: 'The name of the admin', example: 'John Doe', minLength: 2 })
  @IsOptional()
  @IsString()
  @Matches(/^[\u0600-\u06FFa-zA-Z0-9\s._-]+$/, {
    message: 'Name must contain only letters, numbers, spaces, dots, underscores, and hyphens',
  })
  @MinLength(2, { message: 'Name is too short' })
  name?: string;

  @ApiPropertyOptional({ description: 'The phone number of the admin', example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ description: 'The token version for the admin', example: 1 })
  @IsOptional()
  @IsNumberString()
  tokenVersion?: number;

  @ApiPropertyOptional({ description: 'Short bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'User expertise skills and percentages' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpertiseDto)
  expertise?: ExpertiseDto[];

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiPropertyOptional({ description: 'Admin avatar image URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Admin avatar image URL (alias)' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
