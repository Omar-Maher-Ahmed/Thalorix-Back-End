import {
IsEmail,
IsNotEmpty,
IsPhoneNumber,
MinLength,
IsString
} from 'class-validator';

export class CreateAdminDto {

@IsString()
@IsNotEmpty()
name: string;

@IsEmail()
email: string;

@IsPhoneNumber()
phone: string;

@MinLength(8)
password: string;

}