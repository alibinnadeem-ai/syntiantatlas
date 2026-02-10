import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvestDto } from './dto/investments.dto';

@Injectable()
export class InvestmentsService {
  private readonly logger = new Logger(InvestmentsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Core investment flow — runs inside a Prisma transaction.
   * Steps:
   * 1. Validate property exists and is active
   * 2. Validate investment amount is within min/max bounds
   * 3. Validate funding target won't be exceeded
   * 4. Check investor has sufficient wallet balance
   * 5. Calculate shares and ownership percentage
   * 6. Create investment record
   * 7. Update property funding_raised
   * 8. Deduct from investor wallet
   * 9. Create transaction record
   */
  async invest(dto: InvestDto, investorId: number, ip?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Get and validate property
      const property = await tx.property.findUnique({
        where: { id: dto.propertyId },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      if (property.status !== 'active') {
        throw new BadRequestException('Property is not open for investment');
      }

      const amount = new Decimal(dto.amount);
      const minInvestment = property.minInvestment || new Decimal(0);
      const maxInvestment = property.maxInvestment || new Decimal(Number.MAX_SAFE_INTEGER);
      const fundingTarget = property.fundingTarget || new Decimal(0);
      const fundingRaised = property.fundingRaised || new Decimal(0);
      const totalValue = property.totalValue || new Decimal(1);

      // 2. Validate amount bounds
      if (amount.lessThan(minInvestment)) {
        throw new BadRequestException(
          `Minimum investment is ${minInvestment}`,
        );
      }

      if (amount.greaterThan(maxInvestment)) {
        throw new BadRequestException(
          `Maximum investment is ${maxInvestment}`,
        );
      }

      // 3. Check funding target
      const remaining = fundingTarget.minus(fundingRaised);
      if (amount.greaterThan(remaining)) {
        throw new BadRequestException(
          `Only ${remaining} remaining for this property`,
        );
      }

      // 4. Check wallet balance
      const investor = await tx.user.findUnique({
        where: { id: investorId },
      });

      if (!investor) {
        throw new NotFoundException('Investor not found');
      }

      const balance = investor.walletBalance || new Decimal(0);
      if (balance.lessThan(amount)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // 5. Calculate shares and ownership
      const ownershipPercentage = amount.dividedBy(totalValue);
      const sharesOwned = ownershipPercentage.times(1000); // 1000 total shares per property

      // 6. Create investment
      const investment = await tx.investment.create({
        data: {
          investorId,
          propertyId: dto.propertyId,
          amountInvested: amount,
          sharesOwned,
          ownershipPercentage,
        },
      });

      // 7. Update property funding
      await tx.property.update({
        where: { id: dto.propertyId },
        data: {
          fundingRaised: fundingRaised.plus(amount),
          ...(fundingRaised.plus(amount).greaterThanOrEqualTo(fundingTarget) && {
            status: 'funded',
          }),
        },
      });

      // 8. Deduct from wallet
      await tx.user.update({
        where: { id: investorId },
        data: {
          walletBalance: balance.minus(amount),
        },
      });

      // 9. Create transaction record
      await tx.transaction.create({
        data: {
          userId: investorId,
          type: 'investment',
          amount,
          status: 'completed',
          description: `Investment in ${property.title}`,
          referenceNumber: `INV-${investment.id}`,
        },
      });

      return investment;
    });

    await this.auditService.log({
      userId: investorId,
      action: 'invest',
      entityType: 'investment',
      entityId: result.id,
      details: { propertyId: dto.propertyId, amount: dto.amount },
      ipAddress: ip,
    });

    return result;
  }

  async getPortfolio(investorId: number) {
    const investments = await this.prisma.investment.findMany({
      where: { investorId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            propertyType: true,
            totalValue: true,
            fundingTarget: true,
            fundingRaised: true,
            expectedReturnsAnnual: true,
            rentalYield: true,
            status: true,
          },
        },
      },
      orderBy: { investmentDate: 'desc' },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum.plus(inv.amountInvested),
      new Decimal(0),
    );

    const totalShares = investments.reduce(
      (sum, inv) => sum.plus(inv.sharesOwned || new Decimal(0)),
      new Decimal(0),
    );

    return {
      investments,
      summary: {
        totalInvested,
        totalShares,
        propertyCount: new Set(investments.map((i) => i.propertyId)).size,
      },
    };
  }

  async getPropertyInvestments(propertyId: number) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) throw new NotFoundException('Property not found');

    const investments = await this.prisma.investment.findMany({
      where: { propertyId },
      include: {
        investor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { investmentDate: 'desc' },
    });

    return investments;
  }
}
