import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AmlService } from './aml.service';
import { ReviewAlertDto, QueryAlertsDto } from './dto/aml.dto';

@ApiTags('AML Transaction Monitoring')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('api/aml')
export class AmlController {
  constructor(private readonly amlService: AmlService) {}

  // ---------------------------------------------------------------------------
  // Trigger AML scan on recent transactions
  // ---------------------------------------------------------------------------

  @Post('scan')
  @ApiOperation({
    summary: 'Trigger AML scan on recent transactions (admin only)',
    description:
      'Scans all transactions within the specified timeframe for suspicious patterns.',
  })
  @ApiQuery({
    name: 'hoursBack',
    required: false,
    type: Number,
    description: 'Hours to look back (default: 24)',
  })
  async triggerScan(@Query('hoursBack') hoursBack?: string) {
    const hours = hoursBack ? parseInt(hoursBack, 10) : 24;
    return this.amlService.scanAllRecentTransactions(hours);
  }

  // ---------------------------------------------------------------------------
  // Get alerts with filters
  // ---------------------------------------------------------------------------

  @Get('alerts')
  @ApiOperation({
    summary: 'Get AML alerts with optional filters (admin only)',
  })
  async getAlerts(@Query() query: QueryAlertsDto) {
    return this.amlService.getAlerts(query);
  }

  // ---------------------------------------------------------------------------
  // Get alert details
  // ---------------------------------------------------------------------------

  @Get('alerts/:id')
  @ApiOperation({
    summary: 'Get AML alert details (admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Alert (audit log) ID' })
  async getAlert(@Param('id', ParseIntPipe) id: number) {
    return this.amlService.getAlert(id);
  }

  // ---------------------------------------------------------------------------
  // Review / resolve an alert
  // ---------------------------------------------------------------------------

  @Put('alerts/:id/review')
  @ApiOperation({
    summary: 'Review or resolve an AML alert (admin only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Alert (audit log) ID' })
  async reviewAlert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewAlertDto,
    @CurrentUser() user: any,
  ) {
    return this.amlService.reviewAlert(id, dto, user.id);
  }

  // ---------------------------------------------------------------------------
  // User risk profile
  // ---------------------------------------------------------------------------

  @Get('users/:userId/risk')
  @ApiOperation({
    summary: 'Get user AML risk profile (admin only)',
  })
  @ApiParam({ name: 'userId', type: Number })
  async getUserRiskProfile(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.amlService.getUserRiskProfile(userId);
  }

  // ---------------------------------------------------------------------------
  // AML dashboard stats
  // ---------------------------------------------------------------------------

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get AML dashboard statistics (admin only)',
  })
  async getDashboard() {
    return this.amlService.getDashboardStats();
  }
}
