import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DepositDto, WithdrawDto, QueryTransactionsDto } from './dto/transactions.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async deposit(dto: DepositDto, userId: number, ip?: string) {
    const amount = new Decimal(dto.amount);
    const refNumber = `DEP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'deposit',
          amount,
          status: 'completed',
          paymentMethod: dto.paymentMethod || 'bank_transfer',
          gateway: dto.gateway,
          referenceNumber: refNumber,
          description: `Deposit of ${amount}`,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: amount },
        },
      });

      return transaction;
    });

    await this.auditService.log({
      userId,
      action: 'deposit',
      entityType: 'transaction',
      entityId: result.id,
      details: { amount: dto.amount },
      ipAddress: ip,
    });

    return result;
  }

  async withdraw(dto: WithdrawDto, userId: number, ip?: string) {
    const amount = new Decimal(dto.amount);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const balance = user.walletBalance || new Decimal(0);
    if (balance.lessThan(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const refNumber = `WDR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'withdrawal',
          amount,
          status: 'pending',
          paymentMethod: dto.paymentMethod || 'bank_transfer',
          referenceNumber: refNumber,
          description: `Withdrawal of ${amount}`,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: amount },
        },
      });

      return transaction;
    });

    await this.auditService.log({
      userId,
      action: 'withdrawal',
      entityType: 'transaction',
      entityId: result.id,
      details: { amount: dto.amount },
      ipAddress: ip,
    });

    return result;
  }

  async getHistory(userId: number, query: QueryTransactionsDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Compute summary
    const allTransactions = await this.prisma.transaction.findMany({
      where: { userId, status: 'completed' },
      select: { type: true, amount: true },
    });

    const summary = {
      totalDeposits: new Decimal(0),
      totalWithdrawals: new Decimal(0),
      totalInvestments: new Decimal(0),
      totalDividends: new Decimal(0),
    };

    for (const t of allTransactions) {
      switch (t.type) {
        case 'deposit':
          summary.totalDeposits = summary.totalDeposits.plus(t.amount);
          break;
        case 'withdrawal':
          summary.totalWithdrawals = summary.totalWithdrawals.plus(t.amount);
          break;
        case 'investment':
          summary.totalInvestments = summary.totalInvestments.plus(t.amount);
          break;
        case 'dividend':
          summary.totalDividends = summary.totalDividends.plus(t.amount);
          break;
      }
    }

    return {
      data: transactions,
      summary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
