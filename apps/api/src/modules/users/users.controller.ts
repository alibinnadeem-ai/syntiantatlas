import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, QueryUsersDto, CreateStaffDto, AdminUpdateUserDto, SuspendUserDto } from './dto/users.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update own profile' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    return this.usersService.updateProfile(user.id, dto, req.ip);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet balance and recent transactions' })
  async getWallet(@CurrentUser() user: any) {
    return this.usersService.getWallet(user.id);
  }
}

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'operations_manager')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin)' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post('staff')
  @ApiOperation({ summary: 'Create staff account (admin)' })
  async createStaff(
    @Body() dto: CreateStaffDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.usersService.createStaff(dto, admin.id, req.ip);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user details (admin)' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.usersService.adminUpdateUser(id, dto, admin.id, req.ip);
  }

  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspend a user (admin)' })
  async suspendUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendUserDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.usersService.suspendUser(id, dto, admin.id, req.ip);
  }

  @Put(':id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a user (admin)' })
  async unsuspendUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.usersService.unsuspendUser(id, admin.id, req.ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a user (admin)' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.usersService.deactivateUser(id, admin.id, req.ip);
  }
}
