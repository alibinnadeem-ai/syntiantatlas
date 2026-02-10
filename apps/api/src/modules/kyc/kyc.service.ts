import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubmitKycDto, ReviewKycDto, QueryKycDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Submit a KYC verification request for the authenticated user.
   */
  async submit(dto: SubmitKycDto, userId: number, ip?: string) {
    const verification = await this.prisma.kycVerification.create({
      data: {
        userId,
        kycLevel: dto.kycLevel,
        documentType: dto.documentType,
        documentData: dto.documentData ?? {},
        status: 'pending',
      },
    });

    await this.auditService.log({
      userId,
      action: 'kyc_submit',
      entityType: 'kyc_verification',
      entityId: verification.id,
      details: { kycLevel: dto.kycLevel, documentType: dto.documentType },
      ipAddress: ip,
    });

    return verification;
  }

  /**
   * Get the current user's KYC submissions ordered by most recent first.
   */
  async getStatus(userId: number) {
    const submissions = await this.prisma.kycVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, kycLevel: true },
    });

    return {
      kycStatus: user?.kycStatus ?? null,
      kycLevel: user?.kycLevel ?? null,
      submissions,
    };
  }

  /**
   * Admin: list all KYC submissions with filters and pagination.
   */
  async findAll(query: QueryKycDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.kycLevel) where.kycLevel = query.kycLevel;

    const [submissions, total] = await Promise.all([
      this.prisma.kycVerification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              kycStatus: true,
              kycLevel: true,
            },
          },
        },
      }),
      this.prisma.kycVerification.count({ where }),
    ]);

    return {
      data: submissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Admin: get a single KYC submission with user info.
   */
  async findOne(id: number) {
    const submission = await this.prisma.kycVerification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            kycStatus: true,
            kycLevel: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!submission) throw new NotFoundException('KYC submission not found');

    return submission;
  }

  /**
   * Admin: approve or reject a KYC submission.
   * If approved, also updates the user's kycStatus and kycLevel.
   */
  async review(
    id: number,
    dto: ReviewKycDto,
    adminId: number,
    ip?: string,
  ) {
    const submission = await this.prisma.kycVerification.findUnique({
      where: { id },
    });

    if (!submission) throw new NotFoundException('KYC submission not found');

    if (submission.status !== 'pending') {
      throw new BadRequestException('This submission has already been reviewed');
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedSubmission = await tx.kycVerification.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedBy: adminId,
          reviewedAt: now,
          rejectionReason: dto.status === 'rejected' ? dto.rejectionReason : null,
        },
      });

      if (dto.status === 'approved' && submission.userId) {
        await tx.user.update({
          where: { id: submission.userId },
          data: {
            kycStatus: 'verified',
            kycLevel: submission.kycLevel ?? 1,
          },
        });
      }

      return updatedSubmission;
    });

    await this.auditService.log({
      userId: adminId,
      action: `kyc_${dto.status}`,
      entityType: 'kyc_verification',
      entityId: id,
      details: {
        targetUserId: submission.userId,
        kycLevel: submission.kycLevel,
        rejectionReason: dto.rejectionReason,
      },
      ipAddress: ip,
    });

    return updated;
  }
}
