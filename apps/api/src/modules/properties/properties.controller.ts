import {
  Controller,
  Get,
  Post,
  Put,
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
import { PropertiesService } from './properties.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  QueryPropertiesDto,
  UpdatePropertyStatusDto,
} from './dto/properties.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List properties (public)' })
  async findAll(@Query() query: QueryPropertiesDto) {
    return this.propertiesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID (public)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('seller', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property (seller)' })
  async create(
    @Body() dto: CreatePropertyDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.propertiesService.create(dto, user.id, req.ip);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property (owner or admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.propertiesService.update(id, dto, user.id, user.roleId, req.ip);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a property (owner or admin)' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.propertiesService.delete(id, user.id, user.roleId, req.ip);
  }

  @Get('seller/my-properties')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get properties for the current seller' })
  async getSellerProperties(@CurrentUser() user: any) {
    return this.propertiesService.getSellerProperties(user.id);
  }
}

@ApiTags('Admin - Properties')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'operations_manager')
@Controller('admin/properties')
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Get pending properties (admin)' })
  async getPending() {
    return this.propertiesService.getPending();
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Approve or reject property (admin)' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePropertyStatusDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.propertiesService.updateStatus(id, dto, admin.id, req.ip);
  }
}
