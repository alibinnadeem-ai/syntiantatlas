import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ExportAuditDto } from './dto/audit-export.dto';

@Injectable()
export class AuditExportService {
  private readonly logger = new Logger(AuditExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Export audit logs with filters
  // ---------------------------------------------------------------------------

  async exportAuditLogs(dto: ExportAuditDto) {
    const limit = Math.min(dto.limit || 10000, 50000);

    const where: any = {};

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    if (dto.userId) {
      where.userId = dto.userId;
    }

    if (dto.action) {
      where.action = dto.action;
    }

    if (dto.entityType) {
      where.entityType = dto.entityType;
    }

    this.logger.log(
      `Exporting audit logs — format=${dto.format}, limit=${limit}, filters=${JSON.stringify(where)}`,
    );

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return logs;
  }

  // ---------------------------------------------------------------------------
  // Format helpers
  // ---------------------------------------------------------------------------

  formatAsCsv(data: any[]): string {
    const headers = [
      'id',
      'timestamp',
      'userId',
      'userName',
      'userEmail',
      'action',
      'entityType',
      'entityId',
      'details',
      'ipAddress',
    ];

    const rows = data.map((log) => {
      const userName = log.user
        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()
        : '';
      const userEmail = log.user?.email || '';
      const details =
        log.details != null ? JSON.stringify(log.details) : '';

      return [
        log.id,
        log.createdAt ? new Date(log.createdAt).toISOString() : '',
        log.userId ?? '',
        this.escapeCsvField(userName),
        this.escapeCsvField(userEmail),
        this.escapeCsvField(log.action || ''),
        this.escapeCsvField(log.entityType || ''),
        log.entityId ?? '',
        this.escapeCsvField(details),
        this.escapeCsvField(log.ipAddress || ''),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  formatAsJson(data: any[]): string {
    const formatted = data.map((log) => ({
      id: log.id,
      timestamp: log.createdAt
        ? new Date(log.createdAt).toISOString()
        : null,
      userId: log.userId,
      userName: log.user
        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()
        : null,
      userEmail: log.user?.email || null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    return JSON.stringify(formatted, null, 2);
  }

  // ---------------------------------------------------------------------------
  // Export summary
  // ---------------------------------------------------------------------------

  async getExportSummary(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [totalLogs, actionBreakdown, entityTypeBreakdown, uniqueUsers] =
      await Promise.all([
        // Total number of logs in range
        this.prisma.auditLog.count({ where }),

        // Breakdown by action
        this.prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
        }),

        // Breakdown by entityType
        this.prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: { entityType: true },
          orderBy: { _count: { entityType: 'desc' } },
        }),

        // Count of unique users
        this.prisma.auditLog.findMany({
          where: { ...where, userId: { not: null } },
          distinct: ['userId'],
          select: { userId: true },
        }),
      ]);

    return {
      totalLogs,
      actionBreakdown: actionBreakdown.map((row) => ({
        action: row.action,
        count: row._count.action,
      })),
      entityTypeBreakdown: entityTypeBreakdown.map((row) => ({
        entityType: row.entityType,
        count: row._count.entityType,
      })),
      uniqueUsersCount: uniqueUsers.length,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private escapeCsvField(value: string): string {
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
