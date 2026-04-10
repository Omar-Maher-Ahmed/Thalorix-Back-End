import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  verificationLink: string;
}
