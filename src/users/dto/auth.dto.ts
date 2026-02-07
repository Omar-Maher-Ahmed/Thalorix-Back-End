import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, IsUUID, MinLength } from 'class-validator';
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


export class WebsitePasswordDTO {

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;
}

export class WebsiteSignUpDto {

}