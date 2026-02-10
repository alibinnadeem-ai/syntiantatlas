import { IsOptional, IsString, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * PropertyValuationDto
 *
 * No body/query parameters required — the propertyId comes from the URL param.
 */
export class PropertyValuationDto {}

/**
 * PortfolioOptimizationDto
 *
 * For admin queries: specify an investorId to analyse any user's portfolio.
 * For regular users the investorId is inferred from the JWT.
 */
export class PortfolioOptimizationDto {
  @ApiPropertyOptional({ description: 'Investor ID (admin can query any user)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  investorId?: number;
}

/**
 * MarketAnalyticsDto
 *
 * Optional filters for platform-wide market analytics.
 */
export class MarketAnalyticsDto {
  @ApiPropertyOptional({ description: 'Filter by property type' })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Timeframe for analytics',
    enum: ['30d', '90d', '1y', 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsString()
  @IsIn(['30d', '90d', '1y', 'all'])
  timeframe?: '30d' | '90d' | '1y' | 'all';
}
