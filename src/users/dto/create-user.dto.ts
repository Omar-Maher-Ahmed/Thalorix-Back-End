import {
      IsString,
      IsNotEmpty,
      IsEmail,
      IsPhoneNumber,
      // IsNumber, 
      IsEnum,
      MinLength,
      MaxLength,
      // Min, 
      // Length, 
      // Max 
} from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserDto {

      id: UUID

      @IsNotEmpty({ message: 'Name is required' })
      @IsString()
      @MinLength(2, { message: 'Name is too short' })
      name: string;

      //   @IsNotEmpty({ message: 'Last name is required' })
      //   @IsString()
      //   @MinLength(2, { message: 'Last name is too short' })
      //   lastName: string;

      @IsNotEmpty({ message: 'Username is required' })
      @IsString()
      @MinLength(2, { message: 'Username is too short' })
      username: string;

      // @IsUnique({ message: 'Username already exists' })
      @IsNotEmpty({ message: 'Email is required' })
      @IsEmail({}, { message: 'Invalid email format' })
      email: string;

      @IsNotEmpty({ message: 'Phone number is required' })
      @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
      phone: string;

      @IsNotEmpty({ message: 'Password is required' })
      @IsString()
      @MinLength(8, { message: 'Password must be at least 8 characters long' })
      password: string;

      @IsNotEmpty({ message: 'Password is required' })
      @IsString()
      @MinLength(8, { message: 'Password must be at least 8 characters long' })
      cPassword: string;// confirm password

      @IsNotEmpty({ message: 'Role is required' })
      @IsEnum(['admin', 'user', 'manager'], { message: 'Invalid role selection' })
      role: string;

      @IsString()
      @MinLength(2, { message: 'Bio is too short' })
      @MaxLength(255, { message: 'Bio is too long' })
      bio: string

      //   @IsNotEmpty({ message: 'Age is required' })
      //   @IsNumber()
      //   @Min(18, { message: 'Age must be at least 18' })
      //   @Max(100, { message: 'Age must be less than 100' })
      //   age: number;

      //   @IsNotEmpty({ message: 'Gender is required' })
      //   @IsEnum(['male', 'female', 'other'], { message: 'Invalid gender selection' })
      //   gender: string;

      //   @IsNotEmpty({ message: 'National ID is required' })
      //   @IsString()
      //   @Length(14, 14, { message: 'National ID must be exactly 14 characters' })
      //   nationalID: string;
}