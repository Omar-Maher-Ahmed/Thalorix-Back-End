import { ApiProperty } from '@nestjs/swagger';

class UserDto {
  @ApiProperty({ example: '665f8c7b123456700' })
  id: string;

  @ApiProperty({ example: 'Ahmed Ali' })
  name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  email: string;
}

export class DeployedProjectResponseDto {
  @ApiProperty({ example: '665f8c7b123456789' })
  projectId: string;

  @ApiProperty({ example: 'Restaurant Website' })
  projectName: string;

  @ApiProperty({ example: 'Food Ordering Template', nullable: true })
  templateName: string;

  @ApiProperty({ example: 'completed' })
  deploymentStatus: string;

  @ApiProperty({ example: '2026-06-02T10:30:00.000Z' })
  deployedAt: Date;

  @ApiProperty({ example: 'gpt-model-001', nullable: true })
  aiModelId: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}
