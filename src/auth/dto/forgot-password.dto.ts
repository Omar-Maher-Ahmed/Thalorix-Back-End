import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";
import { Match } from "../decorators/match.decorator";

export class PanelForgotPasswordDto {

    @IsEmail()
    email: string;
}

export class PanelResetPasswordDTO {
    @IsString()
    @IsNotEmpty({ message: "Token is required" })
    token: string;

    @IsString()
    @IsNotEmpty({ message: "Password is required" })
    @MinLength(6, { message: "Password must be at least 6 characters" })
    password: string;

    @IsString()
    @IsNotEmpty({ message: "Confirm password is required" })
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string;
}

export class MobileForgotPasswordDto {
    @IsString()
    @IsNotEmpty()
    contact_number: string;

    @IsUUID()
    vendorId: string;
}

export class MobileForgotPasswordVDto {
    @IsUUID()
    patientId: string;
}

export class MobileForgotPasswordCDto {
    @IsUUID()
    patientId: string;
}
