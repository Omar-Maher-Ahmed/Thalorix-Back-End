import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";
import { Match } from "../decorators/match.decorator";
import { ApiProperty } from '@nestjs/swagger';

export class PanelForgotPasswordDto {

    @ApiProperty({ description: 'The email address of the user', example: 'user@example.com' })
    @IsEmail()
    email: string;
}

export class PanelResetPasswordDTO {
    @ApiProperty({ description: 'The token for resetting password' })
    @IsString()
    @IsNotEmpty({ message: "Token is required" })
    token: string;

    @ApiProperty({ description: 'The new password', example: 'StrongP@ssw0rd', minLength: 6 })
    @IsString()
    @IsNotEmpty({ message: "Password is required" })
    @MinLength(6, { message: "Password must be at least 6 characters" })
    password: string;

    @ApiProperty({ description: 'The confirmation of the new password', example: 'StrongP@ssw0rd' })
    @IsString()
    @IsNotEmpty({ message: "Confirm password is required" })
    @Match("password", { message: "Confirm password must match password" })
    cPassword: string;
}

export class MobileForgotPasswordDto {
    @ApiProperty({ description: 'The contact number of the user' })
    @IsString()
    @IsNotEmpty()
    contact_number: string;

    @ApiProperty({ description: 'The vendor ID' })
    @IsUUID()
    vendorId: string;
}

export class MobileForgotPasswordVDto {
    @ApiProperty({ description: 'The patient ID' })
    @IsUUID()
    patientId: string;
}

export class MobileForgotPasswordCDto {
    @ApiProperty({ description: 'The patient ID' })
    @IsUUID()
    patientId: string;
}
