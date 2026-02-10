import { IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDividendDto {
  @ApiProperty({ description: 'Property ID' })
  @Type(() => Number)
  @IsInt()
  propertyId: number;

  @ApiProperty({ description: 'Quarter (1-4)', minimum: 1, maximum: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  quarter: number;

  @ApiProperty({ description: 'Year' })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({ description: 'Total rental income for the quarter' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRentalIncome: number;

  @ApiProperty({ description: 'Total expenses for the quarter' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalExpenses: number;
}

export class QueryDividendsDto {
  @ApiPropertyOptional({ description: 'Filter by property ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  propertyId?: number;

  @ApiPropertyOptional({ description: 'Filter by quarter (1-4)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  quarter?: number;

  @ApiPropertyOptional({ description: 'Filter by year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
