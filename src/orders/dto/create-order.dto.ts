import { IsMongoId, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  templateId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  quantity?: number;
}