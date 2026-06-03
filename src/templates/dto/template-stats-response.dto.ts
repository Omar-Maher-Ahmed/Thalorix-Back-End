import { ApiProperty } from '@nestjs/swagger';

export class TemplateStatsResponseDto {
  @ApiProperty({ example: '665f8c7b123456789' })
  templateId: string;

  @ApiProperty({ example: 'E-Commerce Store' })
  templateName: string;

  @ApiProperty({ example: 'user@example.com' })
  userEmail: string;

  @ApiProperty({ example: 12 })
  sendCount: number;

  @ApiProperty({ example: '2026-06-02T12:00:00.000Z' })
  createdAt: Date;
}
