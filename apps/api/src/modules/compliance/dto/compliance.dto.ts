import { IsString, IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Type of compliance report to generate',
    enum: [
      'quarterly_summary',
      'annual_summary',
      'investor_report',
      'property_report',
      'transaction_report',
    ],
  })
  @IsString()
  @IsIn([
    'quarterly_summary',
    'annual_summary',
    'investor_report',
    'property_report',
    'transaction_report',
  ])
  reportType: string;

  @ApiProperty({ description: 'Report period start date (ISO 8601)' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: 'Report period end date (ISO 8601)' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Property ID for property-specific reports' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  propertyId?: number;

  @ApiPropertyOptional({ description: 'Investor ID for investor-specific reports' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  investorId?: number;
}

export class QueryReportsDto {
  @ApiPropertyOptional({
    description: 'Filter by report type',
    enum: [
      'quarterly_summary',
      'annual_summary',
      'investor_report',
      'property_report',
      'transaction_report',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'quarterly_summary',
    'annual_summary',
    'investor_report',
    'property_report',
    'transaction_report',
  ])
  reportType?: string;

  @ApiPropertyOptional({ description: 'Filter from start date (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter to end date (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;

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
