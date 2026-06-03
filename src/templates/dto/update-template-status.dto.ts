import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum TemplateStatusEnum {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export class UpdateTemplateStatusDto {
  @ApiProperty({
    description: 'The new status of the template',
    enum: TemplateStatusEnum,
    example: 'suspended',
  })
  @IsNotEmpty()
  @IsEnum(TemplateStatusEnum, { message: 'status must be either active or suspended' })
  status: TemplateStatusEnum;
}
