import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationDto {
  @ApiProperty({ description: 'Email address to send verification to' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Name of the recipient' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The verification link to send' })
  @IsUrl()
  @IsNotEmpty()
  verificationLink: string;
}
