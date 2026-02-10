import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvestmentsService } from '../investments.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let prisma: any;
  let auditService: any;

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    status: 'active',
    minInvestment: new Decimal(1000),
    maxInvestment: new Decimal(50000),
    fundingTarget: new Decimal(100000),
    fundingRaised: new Decimal(20000),
    totalValue: new Decimal(200000),
    sellerId: 2,
  };

  const mockInvestor = {
    id: 5,
    email: 'investor@test.com',
    walletBalance: new Decimal(50000),
    roleId: 'investor',
  };

  const mockInvestment = {
    id: 1,
    investorId: 5,
    propertyId: 1,
    amountInvested: new Decimal(10000),
    sharesOwned: new Decimal(50),
    ownershipPercentage: new Decimal(0.05),
    investmentDate: new Date(),
  };

  beforeEach(async () => {
    const txMock = {
      property: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      investment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
    };

    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(txMock)),
      investment: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      property: {
        findUnique: jest.fn(),
      },
      _tx: txMock,
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
  });

  describe('invest', () => {
    it('should create investment successfully', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue(mockProperty);
      tx.user.findUnique.mockResolvedValue(mockInvestor);
      tx.investment.create.mockResolvedValue(mockInvestment);
      tx.property.update.mockResolvedValue({});
      tx.user.update.mockResolvedValue({});
      tx.transaction.create.mockResolvedValue({});

      const result = await service.invest(
        { propertyId: 1, amount: 10000 },
        5,
      );

      expect(result.id).toBe(1);
      expect(tx.investment.create).toHaveBeenCalled();
      expect(tx.property.update).toHaveBeenCalled();
      expect(tx.user.update).toHaveBeenCalled();
      expect(tx.transaction.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invest' }),
      );
    });

    it('should reject investment for non-existent property', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue(null);

      await expect(
        service.invest({ propertyId: 999, amount: 10000 }, 5),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject investment for inactive property', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue({
        ...mockProperty,
        status: 'pending',
      });

      await expect(
        service.invest({ propertyId: 1, amount: 10000 }, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject investment below minimum', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.invest({ propertyId: 1, amount: 500 }, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject investment above maximum', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue(mockProperty);

      await expect(
        service.invest({ propertyId: 1, amount: 100000 }, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject investment exceeding remaining funding', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue({
        ...mockProperty,
        fundingRaised: new Decimal(95000),
      });

      await expect(
        service.invest({ propertyId: 1, amount: 10000 }, 5),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject investment with insufficient balance', async () => {
      const tx = prisma._tx;
      tx.property.findUnique.mockResolvedValue(mockProperty);
      tx.user.findUnique.mockResolvedValue({
        ...mockInvestor,
        walletBalance: new Decimal(5000),
      });

      await expect(
        service.invest({ propertyId: 1, amount: 10000 }, 5),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio with summary', async () => {
      prisma.investment.findMany.mockResolvedValue([
        {
          ...mockInvestment,
          property: mockProperty,
        },
      ]);

      const result = await service.getPortfolio(5);

      expect(result.investments.length).toBe(1);
      expect(result.summary.totalInvested.toNumber()).toBe(10000);
      expect(result.summary.propertyCount).toBe(1);
    });

    it('should return empty portfolio for new investor', async () => {
      prisma.investment.findMany.mockResolvedValue([]);

      const result = await service.getPortfolio(5);

      expect(result.investments.length).toBe(0);
      expect(result.summary.totalInvested.toNumber()).toBe(0);
    });
  });
});
