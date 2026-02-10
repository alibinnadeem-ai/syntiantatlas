import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDividendDto } from './dto/dividends.dto';

@Injectable()
export class DividendsService {
  private readonly logger = new Logger(DividendsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Create a dividend record and distribute payments to all investors.
   *
   * Steps:
   * 1. Validate property exists
   * 2. Create dividend record with calculated net income and distribution per share
   * 3. Find all investments for the property
   * 4. For each investor: create DividendPayment, credit wallet, create Transaction
   * 5. Send notifications to each investor
   *
   * All database operations run inside a Prisma $transaction.
   */
  async createAndDistribute(dto: CreateDividendDto, adminId: number, ip?: string) {
    const totalRentalIncome = new Decimal(dto.totalRentalIncome);
    const totalExpenses = new Decimal(dto.totalExpenses);
    const netIncome = totalRentalIncome.minus(totalExpenses);

    if (netIncome.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        'Net income must be positive to distribute dividends',
      );
    }

    // 1000 shares per property
    const distributionPerShare = netIncome.dividedBy(1000);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Validate property
      const property = await tx.property.findUnique({
        where: { id: dto.propertyId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      // 2. Create dividend record
      const dividend = await tx.dividend.create({
        data: {
          propertyId: dto.propertyId,
          quarter: dto.quarter,
          year: dto.year,
          totalRentalIncome,
          totalExpenses,
          netIncome,
          distributionPerShare,
          distributionDate: new Date(),
        },
      });

      // 3. Find all investments for this property
      const investments = await tx.investment.findMany({
        where: { propertyId: dto.propertyId },
        include: {
          investor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      if (investments.length === 0) {
        this.logger.warn(
          `No investments found for property ${dto.propertyId}; dividend created but no payments distributed`,
        );
        return { dividend, payments: [] };
      }

      // 4. Process each investor
      const payments = [];

      for (const investment of investments) {
        const sharesOwned = investment.sharesOwned || new Decimal(0);
        if (sharesOwned.lessThanOrEqualTo(0)) continue;

        const amountPaid = sharesOwned.times(distributionPerShare);

        // Create DividendPayment
        const payment = await tx.dividendPayment.create({
          data: {
            dividendId: dividend.id,
            investorId: investment.investorId!,
            propertyId: dto.propertyId,
            sharesOwned,
            amountPaid,
            status: 'completed',
          },
        });

        // Credit investor wallet
        await tx.user.update({
          where: { id: investment.investorId! },
          data: {
            walletBalance: { increment: amountPaid },
          },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: investment.investorId!,
            type: 'dividend',
            amount: amountPaid,
            status: 'completed',
            description: `Dividend payment for ${property.title} - Q${dto.quarter} ${dto.year}`,
            referenceNumber: `DIV-${dividend.id}-${payment.id}`,
          },
        });

        payments.push(payment);
      }

      return { dividend, payments };
    });

    // Send notifications outside the transaction
    for (const payment of result.payments) {
      try {
        await this.notificationsService.create(
          payment.investorId,
          'dividend',
          'Dividend Payment Received',
          `You received a dividend payment of $${payment.amountPaid} for Q${dto.quarter} ${dto.year}.`,
          {
            dividendId: result.dividend.id,
            paymentId: payment.id,
            propertyId: dto.propertyId,
            amount: payment.amountPaid.toString(),
          },
        );
      } catch (error: any) {
        this.logger.warn(
          `Failed to send dividend notification to investor ${payment.investorId}: ${error?.message}`,
        );
      }
    }

    // Audit log
    await this.auditService.log({
      userId: adminId,
      action: 'create_dividend',
      entityType: 'dividend',
      entityId: result.dividend.id,
      details: {
        propertyId: dto.propertyId,
        quarter: dto.quarter,
        year: dto.year,
        netIncome: netIncome.toString(),
        distributionPerShare: distributionPerShare.toString(),
        paymentCount: result.payments.length,
      },
      ipAddress: ip,
    });

    this.logger.log(
      `Dividend ${result.dividend.id} created and distributed: ${result.payments.length} payments for property ${dto.propertyId}`,
    );

    return result;
  }

  /**
   * Get all dividends for a specific property, ordered by year/quarter descending.
   */
  async getDividendsByProperty(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const dividends = await this.prisma.dividend.findMany({
      where: { propertyId },
      include: {
        payments: true,
      },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });

    return dividends;
  }

  /**
   * Get all dividend payments for a specific investor, with dividend and property details.
   */
  async getInvestorDividends(investorId: number) {
    const payments = await this.prisma.dividendPayment.findMany({
      where: { investorId },
      include: {
        dividend: true,
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            propertyType: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const totalEarned = payments.reduce(
      (sum, p) => sum.plus(p.amountPaid),
      new Decimal(0),
    );

    return {
      payments,
      summary: {
        totalEarned,
        paymentCount: payments.length,
      },
    };
  }

  /**
   * Get full details of a specific dividend, including all payments with investor info.
   */
  async getDividendDetails(dividendId: number) {
    const dividend = await this.prisma.dividend.findUnique({
      where: { id: dividendId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            propertyType: true,
          },
        },
        payments: {
          include: {
            investor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!dividend) {
      throw new NotFoundException('Dividend not found');
    }

    return dividend;
  }
}
