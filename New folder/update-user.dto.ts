import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsOptional,
  IsNumberString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExpertiseDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  percent?: number;
}

export class SocialLinksDto {
  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  instagram?: string;
}

export class UpdateUserDto {

  @ApiPropertyOptional({ description: 'The email address of the user', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({ description: 'The name of the user', example: 'John Doe', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name is too short' })
  name?: string;

  @ApiPropertyOptional({ description: 'The phone number of the user', example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiPropertyOptional({ description: 'The token version of the user', example: 1 })
  @IsOptional()
  @IsNumberString()
  tokenVersion?: number;

  @ApiPropertyOptional({ description: 'Short bio or biography written by the user about themselves' })
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
}