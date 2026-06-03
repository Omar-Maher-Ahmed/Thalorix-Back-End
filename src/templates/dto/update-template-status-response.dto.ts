import { ApiProperty } from '@nestjs/swagger';

export class UpdateTemplateStatusResponseDto {
  @ApiProperty({ example: 'Template status updated successfully' })
  message: string;

  @ApiProperty({ example: '665f8c7b123456789' })
  templateId: string;

  @ApiProperty({ example: 'suspended' })
  status: string;
}
