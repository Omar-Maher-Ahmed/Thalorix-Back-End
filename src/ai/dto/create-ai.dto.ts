import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAiDto {
  @ApiPropertyOptional({
    description: 'The prompt or query to send to the AI',
    example: 'Summarize the benefits of solar energy in 3 bullet points',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  prompt?: string;
}

