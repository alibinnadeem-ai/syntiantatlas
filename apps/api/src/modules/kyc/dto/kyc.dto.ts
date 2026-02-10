import { IsOptional, IsString, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitKycDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  kycLevel: number;

  @IsString()
  documentType: string;

  @IsOptional()
  documentData?: any;
}

export class ReviewKycDto {
  @IsIn(['approved', 'rejected'])
  status: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class QueryKycDto {
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
  @IsIn(['pending', 'approved', 'rejected'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  kycLevel?: number;
}
