import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Match } from '../decorators/match.decorator'
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebsiteLoginDto {
    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({ description: 'The password of the user', example: 'StrongP@ssw0rd', minLength: 8 })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;
}

export class MobileLoginDto {
    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @ApiProperty({ description: 'The password of the user', example: 'StrongP@ssw0rd', minLength: 8 })
    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    password: string;
}


export class WebsiteSignUpDto {
    @Transform(({ value }) => {
        let cleaned = String(value)
            .replace(/<[^>]*>/g, '')
            .replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleaned) {
            throw new BadRequestException('Name is invalid after cleaning');
        }
        console.log('2. Cleaned value:', cleaned);
        return cleaned;
    })
    @ApiProperty({ description: 'The name of the user', example: 'John Doe', minLength: 3, maxLength: 255 })
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(3, { message: 'Name is too short' })
    @MaxLength(255, { message: 'Name is too long' })
    @Matches(/^[\u0600-\u06FFa-zA-Z]+(?:\s[\u0600-\u06FFa-zA-Z]+)*$/, {
        message: 'Name must contain only letters (Arabic or English) without numbers or symbols'
    })
    name: string;

    // @IsEmail({}, { message: 'Invalid email format' })
    // @IsNotEmpty({ message: 'Email is required' })
    // @Transform(({ value }) => value?.toLowerCase().trim())
    // email: string;

    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail(
    {
        allow_display_name: false,
        require_tld: true,
        allow_ip_domain: false,
    },
    { message: 'Invalid email format' },
    )
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({ description: 'The phone number of the user', example: '+1234567890' })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
    phone: string;

    @ApiProperty({ description: 'The password of the user', example: 'StrongP@ssw0rd', minLength: 8 })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({ description: 'The confirmation password of the user', example: 'StrongP@ssw0rd', minLength: 8 })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string;// confirm password

    // @IsNotEmpty({ message: 'Role is required' })
    // @IsEnum(['admin', 'user', 'seller'], { message: 'Invalid role selection' })
    // role: string = 'user';

}

export class MobileSignUpDto {
    @Transform(({ value }) => {
        let cleaned = String(value);

        // ========== 1. clean name ==========
        cleaned = cleaned
            .replace(/[^\u0600-\u06FFa-zA-Z\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // ========== 2. check name length==========
        if (!cleaned || cleaned.length < 3) {
            throw new BadRequestException('الاسم يجب أن يحتوي على حروف فقط');
        }

        // ========== 3. check name characters==========
        const finalCheck = cleaned.match(/[^\u0600-\u06FFa-zA-Z\s]/g);
        if (finalCheck && finalCheck.length > 0) {
            throw new BadRequestException('الاسم يحتوي على رموز غير مسموح بها');
        }

        return cleaned;
    })
    @ApiProperty({ description: 'The name of the user', example: 'John Doe', minLength: 3, maxLength: 255 })
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(3, { message: 'Name is too short' })
    @MaxLength(255, { message: 'Name is too long' })
    @Matches(/^[\u0600-\u06FFa-zA-Z]+(?:\s[\u0600-\u06FFa-zA-Z]+)*$/, {
        message: 'Name must contain only letters (Arabic or English) without numbers or symbols'
    })
    name: string;

    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail(
    {
        allow_display_name: false,
        require_tld: true,
        allow_ip_domain: false,
    },
    { message: 'Invalid email format' },
    )
    @IsNotEmpty({ message: 'Email is required' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({ description: 'The phone number of the user', example: '+1234567890' })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
    phone: string;

    @ApiProperty({ description: 'The password of the user', example: 'StrongP@ssw0rd', minLength: 8 })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    password: string;

    @ApiProperty({ description: 'The confirmation password of the user', example: 'StrongP@ssw0rd', minLength: 8 })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string;// confirm password

    // @IsNotEmpty({ message: 'Role is required' })
    // @IsEnum(['admin', 'user', 'seller'], { message: 'Invalid role selection' })
    // role: string;


}