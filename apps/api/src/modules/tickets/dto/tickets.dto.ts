import {
  IsOptional,
  IsString,
  IsInt,
  IsIn,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  relatedEntityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  relatedEntityId?: number;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['pending', 'open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignedTo?: number;
}

export class CreateTicketReplyDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class QueryTicketsDto {
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
}

export class AdminQueryTicketsDto {
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
  @IsIn(['pending', 'open', 'in_progress', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignedTo?: number;
}
