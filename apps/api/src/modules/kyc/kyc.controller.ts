import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { SubmitKycDto, ReviewKycDto, QueryKycDto } from './dto/kyc.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC documents for verification' })
  async submit(
    @Body() dto: SubmitKycDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.kycService.submit(dto, user.id, req.ip);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current user KYC status and submissions' })
  async getStatus(@CurrentUser() user: any) {
    return this.kycService.getStatus(user.id);
  }
}

@ApiTags('Admin - KYC')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'operations_manager', 'staff')
@Controller('admin/kyc')
export class AdminKycController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  @ApiOperation({ summary: 'List all KYC submissions (admin)' })
  async findAll(@Query() query: QueryKycDto) {
    return this.kycService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get KYC submission detail (admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kycService.findOne(id);
  }

  @Put(':id/review')
  @ApiOperation({ summary: 'Approve or reject KYC submission (admin)' })
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewKycDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.kycService.review(id, dto, admin.id, req.ip);
  }
}
