import { IsString, IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewAlertDto {
  @ApiProperty({
    description: 'New status for the alert',
    enum: ['reviewed', 'escalated', 'cleared', 'reported'],
  })
  @IsString()
  @IsIn(['reviewed', 'escalated', 'cleared', 'reported'])
  status: string;

  @ApiProperty({ description: 'Review notes' })
  @IsString()
  notes: string;

  @ApiPropertyOptional({ description: 'Reviewer user ID (auto-filled from auth)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reviewedBy?: number;
}

export class QueryAlertsDto {
  @ApiPropertyOptional({
    description: 'Filter by alert status',
    enum: ['pending', 'reviewed', 'escalated', 'cleared', 'reported'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'reviewed', 'escalated', 'cleared', 'reported'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by severity',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  severity?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

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
