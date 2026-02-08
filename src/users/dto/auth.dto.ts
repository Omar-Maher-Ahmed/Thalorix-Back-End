import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, IsStrongPassword, IsUUID, MaxLength, MinLength } from 'class-validator';
import { UUID } from 'crypto';
// import { Match } from '../decorators/match.decorator'

export class WebsiteLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    //   @MinLength(6, { message: 'Password must be at least 6 characters long.' })
    password: string;
}

export class MobileLoginDto {
    @IsString()
    @IsNotEmpty()
    contact_number: string;

    @IsUUID()
    vendorId: string;

    @IsString()
    @IsNotEmpty()
    //   @MinLength(6, { message: 'Password must be at least 6 characters long.' })
    password: string;
}

export class WebsiteSignUpDto {
    id: UUID

    // @IsNotEmpty({ message: 'Name is required' })
    // @IsString()
    // @MinLength(2, { message: 'Name is too short' })
    // name: string;

    // @IsNotEmpty({ message: 'Username is required' })
    // @IsString()
    // @MinLength(2, { message: 'Username is too short' })
    // username: string;

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

    // @IsNotEmpty({ message: 'Role is required' })
    // @IsEnum(['admin', 'user', 'manager'], { message: 'Invalid role selection' })
    // role: string;

}

export class MobileSignUpDto {
    id: UUID

    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    @MinLength(2, { message: 'Name is too short' })
    name: string;


    // @IsNotEmpty({ message: 'Username is required' })
    // @IsString()
    // @MinLength(2, { message: 'Username is too short' })
    // username: string;

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


}

// export class PanelForgotPasswordDto {

//     @IsEmail()
//     email: string;
// }

// export class PanelResetPasswordDTO {
//     @IsString()
//     @IsNotEmpty({ message: "Token is required" })
//     token: string;

//     @IsString()
//     @IsNotEmpty({ message: "Password is required" })
//     @MinLength(6, { message: "Password must be at least 6 characters" })
//     password: string;

//     @IsString()
//     @IsNotEmpty({ message: "Confirm password is required" })
//     @Match("password", { message: "Confirm password must match password" })
//     cPassword: string;
// }

// export class MobileForgotPasswordDto {
//     @IsString()
//     @IsNotEmpty()
//     contact_number: string;

//     @IsUUID()
//     vendorId: string;
// }

// export class MobileForgotPasswordVDto {
//     @IsUUID()
//     patientId: string;
// }

// export class MobileForgotPasswordCDto {
//     @IsUUID()
//     patientId: string;
// }


// export class WebsitePasswordDTO {

//     @IsString()
//     @IsNotEmpty()
//     @IsStrongPassword()
//     password: string;
// }
