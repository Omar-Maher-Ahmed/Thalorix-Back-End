import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ description: 'Email address to send OTP to' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Name of the recipient' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The OTP code to send' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ description: 'Expiration time text for the OTP' })
  @IsString()
  @IsNotEmpty()
  expiresIn: string;
}
