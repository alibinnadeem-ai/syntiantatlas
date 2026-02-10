import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ===========================================================================
  // Quarterly Summary
  // ===========================================================================

  async generateQuarterlySummary(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.logger.log(`Generating quarterly summary: ${startDate} to ${endDate}`);

    // Total investments in period
    const investments = await this.prisma.investment.findMany({
      where: {
        investmentDate: { gte: start, lte: end },
      },
      select: { amountInvested: true, investorId: true },
    });

    const totalInvestments = investments.length;
    const totalInvestmentAmount = investments.reduce(
      (sum, inv) => sum.plus(inv.amountInvested || new Decimal(0)),
      new Decimal(0),
    );

    // Total transactions in period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: { amount: true, type: true, status: true },
    });

    const totalTransactions = transactions.length;
    const totalTransactionVolume = transactions.reduce(
      (sum, tx) => sum.plus(tx.amount),
      new Decimal(0),
    );

    // Total dividends distributed in period
    const dividends = await this.prisma.dividendPayment.findMany({
      where: {
        paidAt: { gte: start, lte: end },
      },
      select: { amountPaid: true },
    });

    const totalDividendsDistributed = dividends.reduce(
      (sum, d) => sum.plus(d.amountPaid),
      new Decimal(0),
    );

    // Active properties
    const activeProperties = await this.prisma.property.count({
      where: { status: { not: 'inactive' } },
    });

    // New investors in period
    const uniqueInvestorIds = new Set(
      investments.map((inv) => inv.investorId).filter(Boolean),
    );
    const newInvestors = uniqueInvestorIds.size;

    // KYC completion rates
    const totalUsers = await this.prisma.user.count();
    const kycApproved = await this.prisma.user.count({
      where: { kycStatus: 'approved' },
    });
    const kycCompletionRate =
      totalUsers > 0
        ? Math.round((kycApproved / totalUsers) * 10000) / 100
        : 0;

    const report = {
      reportType: 'quarterly_summary',
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvestments,
        totalInvestmentAmount: totalInvestmentAmount.toNumber(),
        totalTransactions,
        totalTransactionVolume: totalTransactionVolume.toNumber(),
        totalDividendsDistributed: totalDividendsDistributed.toNumber(),
        activeProperties,
        newInvestors,
        kycCompletionRate,
      },
    };

    // Store report generation in audit logs
    await this.auditService.log({
      action: 'compliance_report_generated',
      entityType: 'compliance',
      details: {
        reportType: 'quarterly_summary',
        period: { startDate, endDate },
        generatedAt: report.generatedAt,
      },
    });

    return report;
  }

  // ===========================================================================
  // Annual Summary
  // ===========================================================================

  async generateAnnualSummary(year: number) {
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.logger.log(`Generating annual summary for ${year}`);

    // Base quarterly data
    const investments = await this.prisma.investment.findMany({
      where: {
        investmentDate: { gte: start, lte: end },
      },
      include: { property: { select: { id: true, title: true, propertyType: true } } },
    });

    const totalInvestments = investments.length;
    const totalInvestmentAmount = investments.reduce(
      (sum, inv) => sum.plus(inv.amountInvested || new Decimal(0)),
      new Decimal(0),
    );

    // Transactions
    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { amount: true, type: true, status: true },
    });

    const totalTransactionVolume = transactions.reduce(
      (sum, tx) => sum.plus(tx.amount),
      new Decimal(0),
    );

    // Dividends
    const dividendPayments = await this.prisma.dividendPayment.findMany({
      where: { paidAt: { gte: start, lte: end } },
      select: { amountPaid: true },
    });

    const totalDividendsDistributed = dividendPayments.reduce(
      (sum, d) => sum.plus(d.amountPaid),
      new Decimal(0),
    );

    // Property status breakdown
    const properties = await this.prisma.property.findMany({
      select: { status: true, totalValue: true, fundingRaised: true },
    });

    const propertyStatusBreakdown: Record<string, number> = {};
    for (const prop of properties) {
      const status = prop.status || 'unknown';
      propertyStatusBreakdown[status] = (propertyStatusBreakdown[status] || 0) + 1;
    }

    // Total platform AUM (Assets Under Management)
    const totalAUM = properties.reduce(
      (sum, p) => sum.plus(p.fundingRaised || new Decimal(0)),
      new Decimal(0),
    );

    // Top-performing properties (by total investment in the year)
    const propertyInvestmentMap = new Map<number, Decimal>();
    for (const inv of investments) {
      if (inv.propertyId) {
        const current = propertyInvestmentMap.get(inv.propertyId) || new Decimal(0);
        propertyInvestmentMap.set(
          inv.propertyId,
          current.plus(inv.amountInvested || new Decimal(0)),
        );
      }
    }

    const topProperties = Array.from(propertyInvestmentMap.entries())
      .sort((a, b) => b[1].minus(a[1]).toNumber())
      .slice(0, 5)
      .map(([propertyId, amount]) => {
        const inv = investments.find((i) => i.propertyId === propertyId);
        return {
          propertyId,
          title: inv?.property?.title || 'Unknown',
          propertyType: inv?.property?.propertyType || 'Unknown',
          totalInvested: amount.toNumber(),
        };
      });

    // New investors
    const uniqueInvestorIds = new Set(
      investments.map((inv) => inv.investorId).filter(Boolean),
    );

    // KYC stats
    const totalUsers = await this.prisma.user.count();
    const kycApproved = await this.prisma.user.count({
      where: { kycStatus: 'approved' },
    });

    const report = {
      reportType: 'annual_summary',
      year,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvestments,
        totalInvestmentAmount: totalInvestmentAmount.toNumber(),
        totalTransactions: transactions.length,
        totalTransactionVolume: totalTransactionVolume.toNumber(),
        totalDividendsDistributed: totalDividendsDistributed.toNumber(),
        totalPlatformAUM: totalAUM.toNumber(),
        newInvestors: uniqueInvestorIds.size,
        totalUsers,
        kycApproved,
        kycCompletionRate:
          totalUsers > 0
            ? Math.round((kycApproved / totalUsers) * 10000) / 100
            : 0,
      },
      propertyStatusBreakdown,
      topPerformingProperties: topProperties,
    };

    await this.auditService.log({
      action: 'compliance_report_generated',
      entityType: 'compliance',
      details: {
        reportType: 'annual_summary',
        year,
        generatedAt: report.generatedAt,
      },
    });

    return report;
  }

  // ===========================================================================
  // Investor Report
  // ===========================================================================

  async generateInvestorReport(
    investorId: number,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.logger.log(`Generating investor report for user ${investorId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: investorId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        kycStatus: true,
        kycLevel: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Investor with ID ${investorId} not found`);
    }

    // All investments
    const investments = await this.prisma.investment.findMany({
      where: { investorId },
      include: {
        property: {
          select: { id: true, title: true, propertyType: true, totalValue: true },
        },
      },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum.plus(inv.amountInvested || new Decimal(0)),
      new Decimal(0),
    );

    // Dividends received
    const dividendPayments = await this.prisma.dividendPayment.findMany({
      where: {
        investorId,
        paidAt: { gte: start, lte: end },
      },
      select: { amountPaid: true, propertyId: true, paidAt: true },
    });

    const totalDividendsReceived = dividendPayments.reduce(
      (sum, d) => sum.plus(d.amountPaid),
      new Decimal(0),
    );

    // Transactions in period
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: investorId,
        createdAt: { gte: start, lte: end },
      },
      select: { type: true, amount: true, status: true, createdAt: true },
    });

    // Portfolio value (sum of investments)
    const portfolioValue = investments.reduce(
      (sum, inv) => sum.plus(inv.amountInvested || new Decimal(0)),
      new Decimal(0),
    );

    // Compliance flags
    const complianceFlags: string[] = [];
    if (user.kycStatus !== 'approved') {
      complianceFlags.push('KYC not approved');
    }
    if ((user.kycLevel || 0) < 2 && totalInvested.greaterThan(50000)) {
      complianceFlags.push('High investment amount with low KYC level');
    }

    const report = {
      reportType: 'investor_report',
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      investor: {
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        kycStatus: user.kycStatus,
        kycLevel: user.kycLevel,
        accountCreated: user.createdAt,
      },
      portfolio: {
        totalInvested: totalInvested.toNumber(),
        portfolioValue: portfolioValue.toNumber(),
        totalDividendsReceived: totalDividendsReceived.toNumber(),
        investmentCount: investments.length,
        holdings: investments.map((inv) => ({
          propertyId: inv.propertyId,
          title: inv.property?.title || 'Unknown',
          propertyType: inv.property?.propertyType || 'Unknown',
          amountInvested: Number(inv.amountInvested),
          sharesOwned: Number(inv.sharesOwned || 0),
          investmentDate: inv.investmentDate,
        })),
      },
      transactions: {
        count: transactions.length,
        items: transactions.map((tx) => ({
          type: tx.type,
          amount: Number(tx.amount),
          status: tx.status,
          date: tx.createdAt,
        })),
      },
      complianceFlags,
    };

    await this.auditService.log({
      action: 'compliance_report_generated',
      entityType: 'compliance',
      details: {
        reportType: 'investor_report',
        investorId,
        period: { startDate, endDate },
        generatedAt: report.generatedAt,
      },
    });

    return report;
  }

  // ===========================================================================
  // Property Report
  // ===========================================================================

  async generatePropertyReport(
    propertyId: number,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.logger.log(`Generating property report for property ${propertyId}`);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found`);
    }

    // Funding progress
    const fundingTarget = property.fundingTarget || new Decimal(0);
    const fundingRaised = property.fundingRaised || new Decimal(0);
    const fundingProgress = fundingTarget.greaterThan(0)
      ? fundingRaised.dividedBy(fundingTarget).times(100).toNumber()
      : 0;

    // Investor count
    const investments = await this.prisma.investment.findMany({
      where: { propertyId },
      select: { investorId: true, amountInvested: true },
    });

    const uniqueInvestors = new Set(investments.map((i) => i.investorId));

    // Dividend history
    const dividends = await this.prisma.dividend.findMany({
      where: { propertyId },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });

    const dividendHistory = dividends.map((d) => ({
      quarter: d.quarter,
      year: d.year,
      totalRentalIncome: d.totalRentalIncome ? Number(d.totalRentalIncome) : 0,
      totalExpenses: d.totalExpenses ? Number(d.totalExpenses) : 0,
      netIncome: d.netIncome ? Number(d.netIncome) : 0,
      distributionPerShare: d.distributionPerShare
        ? Number(d.distributionPerShare)
        : 0,
      distributionDate: d.distributionDate,
    }));

    // Marketplace activity in period
    const trades = await this.prisma.marketplaceTrade.findMany({
      where: {
        propertyId,
        executedAt: { gte: start, lte: end },
      },
      select: {
        totalPrice: true,
        sharesBought: true,
        pricePerShare: true,
        status: true,
        executedAt: true,
      },
    });

    const totalTradingVolume = trades.reduce(
      (sum, t) => sum.plus(t.totalPrice),
      new Decimal(0),
    );

    // Compliance status
    const complianceStatus: string[] = [];
    if (property.status === 'active') complianceStatus.push('Active listing');
    if (property.status === 'funded') complianceStatus.push('Fully funded');
    if (fundingProgress < 100)
      complianceStatus.push(`Funding at ${Math.round(fundingProgress)}%`);
    if (dividends.length === 0)
      complianceStatus.push('No dividends distributed yet');

    const report = {
      reportType: 'property_report',
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      property: {
        id: property.id,
        title: property.title,
        propertyType: property.propertyType,
        location: property.location,
        city: property.city,
        status: property.status,
        totalValue: property.totalValue ? Number(property.totalValue) : 0,
      },
      funding: {
        target: fundingTarget.toNumber(),
        raised: fundingRaised.toNumber(),
        progressPercent: Math.round(fundingProgress * 100) / 100,
        investorCount: uniqueInvestors.size,
      },
      dividendHistory,
      marketplace: {
        tradesInPeriod: trades.length,
        totalTradingVolume: totalTradingVolume.toNumber(),
        trades: trades.map((t) => ({
          totalPrice: Number(t.totalPrice),
          sharesBought: Number(t.sharesBought),
          pricePerShare: Number(t.pricePerShare),
          status: t.status,
          executedAt: t.executedAt,
        })),
      },
      complianceStatus,
    };

    await this.auditService.log({
      action: 'compliance_report_generated',
      entityType: 'compliance',
      details: {
        reportType: 'property_report',
        propertyId,
        period: { startDate, endDate },
        generatedAt: report.generatedAt,
      },
    });

    return report;
  }

  // ===========================================================================
  // Transaction Report
  // ===========================================================================

  async generateTransactionReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    this.logger.log(`Generating transaction report: ${startDate} to ${endDate}`);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Categorize by type
    const byType: Record<string, { count: number; volume: Decimal }> = {};
    for (const tx of transactions) {
      if (!byType[tx.type]) {
        byType[tx.type] = { count: 0, volume: new Decimal(0) };
      }
      byType[tx.type].count += 1;
      byType[tx.type].volume = byType[tx.type].volume.plus(tx.amount);
    }

    const typeBreakdown = Object.entries(byType).map(([type, data]) => ({
      type,
      count: data.count,
      volume: data.volume.toNumber(),
    }));

    // Categorize by gateway
    const byGateway: Record<string, { count: number; volume: Decimal }> = {};
    for (const tx of transactions) {
      const gw = tx.gateway || 'unknown';
      if (!byGateway[gw]) {
        byGateway[gw] = { count: 0, volume: new Decimal(0) };
      }
      byGateway[gw].count += 1;
      byGateway[gw].volume = byGateway[gw].volume.plus(tx.amount);
    }

    const gatewayBreakdown = Object.entries(byGateway).map(
      ([gateway, data]) => ({
        gateway,
        count: data.count,
        volume: data.volume.toNumber(),
      }),
    );

    // Categorize by status
    const byStatus: Record<string, number> = {};
    for (const tx of transactions) {
      const status = tx.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    const totalVolume = transactions.reduce(
      (sum, tx) => sum.plus(tx.amount),
      new Decimal(0),
    );

    const report = {
      reportType: 'transaction_report',
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalTransactions: transactions.length,
        totalVolume: totalVolume.toNumber(),
      },
      typeBreakdown,
      gatewayBreakdown,
      statusBreakdown: byStatus,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        gateway: tx.gateway,
        paymentMethod: tx.paymentMethod,
        referenceNumber: tx.referenceNumber,
        status: tx.status,
        user: tx.user,
        createdAt: tx.createdAt,
      })),
    };

    await this.auditService.log({
      action: 'compliance_report_generated',
      entityType: 'compliance',
      details: {
        reportType: 'transaction_report',
        period: { startDate, endDate },
        totalTransactions: transactions.length,
        generatedAt: report.generatedAt,
      },
    });

    return report;
  }

  // ===========================================================================
  // Report History
  // ===========================================================================

  async getReportHistory() {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'compliance_report_generated',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    return {
      data: logs.map((log: any) => {
        const details = log.details as any;
        return {
          id: log.id,
          reportType: details?.reportType,
          period: details?.period,
          year: details?.year,
          investorId: details?.investorId,
          propertyId: details?.propertyId,
          generatedAt: details?.generatedAt || log.createdAt,
          generatedBy: log.user,
        };
      }),
      total: logs.length,
    };
  }
}
