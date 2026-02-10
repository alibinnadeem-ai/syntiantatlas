import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditExportService } from './audit-export.service';
import { ExportAuditDto, ExportSummaryQueryDto } from './dto/audit-export.dto';

@ApiTags('Audit Export')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('api/audit-export')
export class AuditExportController {
  private readonly logger = new Logger(AuditExportController.name);

  constructor(private readonly auditExportService: AuditExportService) {}

  // ---------------------------------------------------------------------------
  // Export audit logs as CSV or JSON file download
  // ---------------------------------------------------------------------------

  @Post()
  @ApiOperation({
    summary: 'Export audit logs as a downloadable CSV or JSON file (admin only)',
    description:
      'Queries audit logs with optional filters and returns the result ' +
      'as a file download in the requested format.',
  })
  @ApiResponse({ status: 200, description: 'File download of audit logs' })
  async exportAuditLogs(
    @Body() dto: ExportAuditDto,
    @Res() res: Response,
  ) {
    this.logger.log(`Audit export requested — format=${dto.format}`);

    const data = await this.auditExportService.exportAuditLogs(dto);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (dto.format === 'csv') {
      const csv = this.auditExportService.formatAsCsv(data);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-export-${timestamp}.csv"`,
      );
      return res.send(csv);
    }

    // JSON format
    const json = this.auditExportService.formatAsJson(data);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="audit-export-${timestamp}.json"`,
    );
    return res.send(json);
  }

  // ---------------------------------------------------------------------------
  // Export summary stats
  // ---------------------------------------------------------------------------

  @Get('summary')
  @ApiOperation({
    summary: 'Get audit export summary statistics (admin only)',
    description:
      'Returns aggregate stats: total logs, breakdown by action / entity type, ' +
      'unique user count, and the queried date range.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Summary period start (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Summary period end (ISO 8601)',
  })
  async getExportSummary(@Query() query: ExportSummaryQueryDto) {
    return this.auditExportService.getExportSummary(
      query.startDate,
      query.endDate,
    );
  }
}
