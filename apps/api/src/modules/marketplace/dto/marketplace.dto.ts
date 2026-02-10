import {
  IsNumber,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ description: 'Property ID to list shares for' })
  @Type(() => Number)
  @IsInt()
  propertyId: number;

  @ApiProperty({ description: 'Number of shares to list', minimum: 0.0001 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  shares: number;

  @ApiProperty({ description: 'Price per share', minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  pricePerShare: number;

  @ApiPropertyOptional({ description: 'Listing expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class BuySharesDto {
  @ApiProperty({ description: 'Marketplace listing ID' })
  @Type(() => Number)
  @IsInt()
  listingId: number;

  @ApiProperty({ description: 'Number of shares to buy', minimum: 0.0001 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  shares: number;
}

export class QueryListingsDto {
  @ApiPropertyOptional({ description: 'Filter by property ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  propertyId?: number;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'sold', 'cancelled', 'expired'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'sold', 'cancelled', 'expired'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by seller ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sellerId?: number;

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

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['price_asc', 'price_desc', 'newest', 'oldest'])
  sortBy?: string;
}
