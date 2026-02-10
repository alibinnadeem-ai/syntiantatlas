import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  areaSqft?: number;

  @Type(() => Number)
  @IsNumber()
  totalValue: number;

  @Type(() => Number)
  @IsNumber()
  fundingTarget: number;

  @Type(() => Number)
  @IsNumber()
  minInvestment: number;

  @Type(() => Number)
  @IsNumber()
  maxInvestment: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expectedReturnsAnnual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rentalYield?: number;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  areaSqft?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fundingTarget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minInvestment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxInvestment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  expectedReturnsAnnual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rentalYield?: number;
}

export class QueryPropertiesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsIn(['active', 'pending', 'funded', 'closed'])
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdatePropertyStatusDto {
  @IsIn(['active', 'rejected', 'closed'])
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
