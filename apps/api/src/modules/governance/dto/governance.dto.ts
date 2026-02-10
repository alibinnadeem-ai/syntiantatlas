import { IsNotEmpty, IsString, IsInt, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProposalDto {
  @ApiProperty({ description: 'Property ID the proposal is for' })
  @IsInt()
  @IsNotEmpty()
  propertyId: number;

  @ApiProperty({ description: 'Proposal title', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Detailed proposal description' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CastVoteDto {
  @ApiProperty({ description: 'Vote direction', enum: ['for', 'against'] })
  @IsString()
  @IsIn(['for', 'against'])
  vote: string;
}

export class QueryProposalsDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: ['active', 'passed', 'failed', 'executed', 'cancelled'] })
  @IsString()
  @IsIn(['active', 'passed', 'failed', 'executed', 'cancelled'])
  status?: string;
}
