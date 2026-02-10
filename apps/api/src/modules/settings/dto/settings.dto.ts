import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({ description: 'Unique setting key', example: 'platform.fee_percentage' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({ description: 'Setting value', example: '2.5' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Human-readable description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category for grouping', example: 'platform' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

export class UpdateSettingDto {
  @ApiProperty({ description: 'New value for the setting', example: '3.0' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class QuerySettingsDto {
  @ApiPropertyOptional({ description: 'Filter by category', example: 'platform' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
