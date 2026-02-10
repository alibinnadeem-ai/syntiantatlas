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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
  CreateSettingDto,
  UpdateSettingDto,
  QuerySettingsDto,
} from './dto/settings.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Admin - Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all system settings' })
  async findAll(@Query() query: QuerySettingsDto) {
    return this.settingsService.findAll(query.category);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a single setting by key' })
  async findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a setting value' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.settingsService.update(
      key,
      dto.value,
      dto.description,
      admin.id,
      req.ip,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new system setting' })
  async create(
    @Body() dto: CreateSettingDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.settingsService.create(dto, admin.id, req.ip);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a system setting' })
  async remove(
    @Param('key') key: string,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.settingsService.remove(key, admin.id, req.ip);
  }
}
