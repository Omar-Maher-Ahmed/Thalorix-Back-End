import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { UUID } from "crypto";

export class UpdateUserDto {
  id: UUID

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @MinLength(2, { message: 'Name is too short' })
  name: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phone: string;
}