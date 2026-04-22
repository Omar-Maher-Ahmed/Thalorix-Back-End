import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsOptional,
  IsNumberString,
  Matches,
} from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, {
    message: 'Name must contain only letters and spaces',
  })
  @MinLength(2, { message: 'Name is too short' })
  name?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  @IsNumberString()
  tokenVersion?: number;
}
