import { IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class InvestDto {
  @Type(() => Number)
  @IsInt()
  propertyId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;
}
