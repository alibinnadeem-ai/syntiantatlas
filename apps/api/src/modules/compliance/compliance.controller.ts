import {
  Controller,
  Get,
  Post,
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
import { ComplianceService } from './compliance.service';
import { GenerateReportDto } from './dto/compliance.dto';

@ApiTags('Compliance Reporting')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('api/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // ---------------------------------------------------------------------------
  // Generate a report (dispatches to the correct generator)
  // ---------------------------------------------------------------------------

  @Post('reports/generate')
  @ApiOperation({
    summary: 'Generate a compliance report (admin only)',
    description:
      'Dispatches to the appropriate report generator based on reportType.',
  })
  async generateReport(@Body() dto: GenerateReportDto) {
    switch (dto.reportType) {
      case 'quarterly_summary':
        return this.complianceService.generateQuarterlySummary(
          dto.startDate,
          dto.endDate,
        );
      case 'annual_summary': {
        const year = new Date(dto.startDate).getFullYear();
        return this.complianceService.generateAnnualSummary(year);
      }
      case 'investor_report':
        if (!dto.investorId) {
          return { error: 'investorId is required for investor_report' };
        }
        return this.complianceService.generateInvestorReport(
          dto.investorId,
          dto.startDate,
          dto.endDate,
        );
      case 'property_report':
        if (!dto.propertyId) {
          return { error: 'propertyId is required for property_report' };
        }
        return this.complianceService.generatePropertyReport(
          dto.propertyId,
          dto.startDate,
          dto.endDate,
        );
      case 'transaction_report':
        return this.complianceService.generateTransactionReport(
          dto.startDate,
          dto.endDate,
        );
      default:
        return { error: `Unknown report type: ${dto.reportType}` };
    }
  }

  // ---------------------------------------------------------------------------
  // Quick quarterly summary
  // ---------------------------------------------------------------------------

  @Get('reports/quarterly')
  @ApiOperation({
    summary: 'Get a quick quarterly summary (admin only)',
  })
  @ApiQuery({ name: 'quarter', type: Number, required: true, description: 'Quarter (1-4)' })
  @ApiQuery({ name: 'year', type: Number, required: true, description: 'Year' })
  async getQuarterlySummary(
    @Query('quarter', ParseIntPipe) quarter: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    const quarterStartMonth = (quarter - 1) * 3;
    const startDate = new Date(year, quarterStartMonth, 1).toISOString();
    const endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999).toISOString();

    return this.complianceService.generateQuarterlySummary(startDate, endDate);
  }

  // ---------------------------------------------------------------------------
  // Annual summary
  // ---------------------------------------------------------------------------

  @Get('reports/annual/:year')
  @ApiOperation({
    summary: 'Get annual compliance summary (admin only)',
  })
  @ApiParam({ name: 'year', type: Number })
  async getAnnualSummary(@Param('year', ParseIntPipe) year: number) {
    return this.complianceService.generateAnnualSummary(year);
  }

  // ---------------------------------------------------------------------------
  // Investor compliance report
  // ---------------------------------------------------------------------------

  @Get('reports/investor/:investorId')
  @ApiOperation({
    summary: 'Get investor compliance report (admin only)',
  })
  @ApiParam({ name: 'investorId', type: Number })
  @ApiQuery({ name: 'startDate', required: false, description: 'Period start (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Period end (ISO 8601)' })
  async getInvestorReport(
    @Param('investorId', ParseIntPipe) investorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = endDate || new Date().toISOString();

    return this.complianceService.generateInvestorReport(investorId, start, end);
  }

  // ---------------------------------------------------------------------------
  // Property compliance report
  // ---------------------------------------------------------------------------

  @Get('reports/property/:propertyId')
  @ApiOperation({
    summary: 'Get property compliance report (admin only)',
  })
  @ApiParam({ name: 'propertyId', type: Number })
  @ApiQuery({ name: 'startDate', required: false, description: 'Period start (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Period end (ISO 8601)' })
  async getPropertyReport(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = endDate || new Date().toISOString();

    return this.complianceService.generatePropertyReport(propertyId, start, end);
  }

  // ---------------------------------------------------------------------------
  // Transaction report
  // ---------------------------------------------------------------------------

  @Get('reports/transactions')
  @ApiOperation({
    summary: 'Get transaction compliance report (admin only)',
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Period start (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Period end (ISO 8601)' })
  async getTransactionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.complianceService.generateTransactionReport(startDate, endDate);
  }

  // ---------------------------------------------------------------------------
  // Report generation history
  // ---------------------------------------------------------------------------

  @Get('reports/history')
  @ApiOperation({
    summary: 'Get compliance report generation history (admin only)',
  })
  async getReportHistory() {
    return this.complianceService.getReportHistory();
  }
}
