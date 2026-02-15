import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import sanitizeHtml from 'sanitize-html';
import { Match } from '../decorators/match.decorator'
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export class WebsiteLoginDto {
    @IsEmail()
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}

export class MobileLoginDto {
    @IsString()
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    password: string;
}


export class WebsiteSignUpDto {
    @Matches(/^[\u0600-\u06FFa-zA-Z\s]+$/, {
        message: 'Name must contain only letters (Arabic or English) without numbers or symbols'
    })
    @IsNotEmpty({ message: 'Name is required' })
    @Transform(({ value }) => {
        let cleaned = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {}
        });
        cleaned = cleaned.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        if (!cleaned || cleaned.length < 3) {
            throw new BadRequestException('Name is too short');
        }
        return cleaned;
    })
    name: string;

    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => value?.toLowerCase().trim())
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
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string;// confirm password

    @IsNotEmpty({ message: 'Role is required' })
    @IsEnum(['admin', 'user', 'manager'], { message: 'Invalid role selection' })
    role: string = 'user';

}

export class MobileSignUpDto {

    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    @MinLength(2, { message: 'Name is too short' })
    name: string;

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
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string;// confirm password

    @IsNotEmpty({ message: 'Role is required' })
    @IsEnum(['admin', 'user', 'manager'], { message: 'Invalid role selection' })
    role: string;


}


export class ForgotPasswordDto {
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: "Token is required" })
    token: string;

    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @IsNotEmpty({ message: 'Confirm Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string; // confirm password
}

export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty({ message: "Token is required" })
    token: string;
}