import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The old password of the user', example: 'OldPassword123!' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: 'The new password for the user', example: 'NewPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
