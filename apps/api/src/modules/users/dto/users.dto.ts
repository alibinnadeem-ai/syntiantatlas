import { IsOptional, IsString, IsEmail, IsIn, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class QueryUsersDto {
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
  search?: string;

  @IsOptional()
  @IsIn(['investor', 'seller', 'admin', 'staff', 'operations_manager'])
  roleId?: string;

  @IsOptional()
  @IsIn(['active', 'suspended', 'banned'])
  status?: string;
}

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn(['staff', 'operations_manager'])
  roleId: string;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(['investor', 'seller', 'admin', 'staff', 'operations_manager'])
  roleId?: string;
}

export class SuspendUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
