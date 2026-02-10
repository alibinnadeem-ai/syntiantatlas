import { IsString, IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Entity type the document relates to',
    enum: ['property', 'kyc', 'compliance'],
  })
  @IsString()
  @IsIn(['property', 'kyc', 'compliance'])
  entityType: string;

  @ApiProperty({ description: 'ID of the related entity' })
  @Type(() => Number)
  @IsInt()
  entityId: number;

  @ApiProperty({ description: 'Original filename of the document' })
  @IsString()
  filename: string;

  @ApiPropertyOptional({ description: 'Description of the document' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Base64-encoded file content (temporary until multipart support)',
  })
  @IsOptional()
  @IsString()
  content?: string;
}

export class QueryDocumentsDto {
  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: ['property', 'kyc', 'compliance'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['property', 'kyc', 'compliance'])
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

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
