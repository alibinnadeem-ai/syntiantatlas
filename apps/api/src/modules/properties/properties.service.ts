import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  QueryPropertiesDto,
  UpdatePropertyStatusDto,
} from './dto/properties.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: QueryPropertiesDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          seller: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { investments: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { investments: true } },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    const investorCount = await this.prisma.investment.count({
      where: { propertyId: id },
    });

    return { ...property, investorCount };
  }

  async create(dto: CreatePropertyDto, sellerId: number, ip?: string) {
    const property = await this.prisma.property.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        address: dto.address,
        city: dto.city,
        propertyType: dto.propertyType,
        areaSqft: dto.areaSqft ? new Decimal(dto.areaSqft) : null,
        totalValue: new Decimal(dto.totalValue),
        fundingTarget: new Decimal(dto.fundingTarget),
        minInvestment: new Decimal(dto.minInvestment),
        maxInvestment: new Decimal(dto.maxInvestment),
        expectedReturnsAnnual: dto.expectedReturnsAnnual
          ? new Decimal(dto.expectedReturnsAnnual)
          : null,
        rentalYield: dto.rentalYield ? new Decimal(dto.rentalYield) : null,
        status: 'pending',
        sellerId,
      },
    });

    await this.auditService.log({
      userId: sellerId,
      action: 'create_property',
      entityType: 'property',
      entityId: property.id,
      ipAddress: ip,
    });

    return property;
  }

  async update(id: number, dto: UpdatePropertyDto, userId: number, userRole: string, ip?: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    const isAdmin = ['admin', 'operations_manager'].includes(userRole);
    if (!isAdmin && property.sellerId !== userId) {
      throw new ForbiddenException('Not authorized to edit this property');
    }

    // Sellers can only edit pending or rejected properties
    if (!isAdmin && !['pending', 'rejected'].includes(property.status || '')) {
      throw new BadRequestException('Can only edit properties that are pending review or rejected');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.location !== undefined) data.location = dto.location;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.propertyType !== undefined) data.propertyType = dto.propertyType;
    if (dto.areaSqft !== undefined) data.areaSqft = new Decimal(dto.areaSqft);
    if (dto.totalValue !== undefined) data.totalValue = new Decimal(dto.totalValue);
    if (dto.fundingTarget !== undefined) data.fundingTarget = new Decimal(dto.fundingTarget);
    if (dto.minInvestment !== undefined) data.minInvestment = new Decimal(dto.minInvestment);
    if (dto.maxInvestment !== undefined) data.maxInvestment = new Decimal(dto.maxInvestment);
    if (dto.expectedReturnsAnnual !== undefined)
      data.expectedReturnsAnnual = new Decimal(dto.expectedReturnsAnnual);
    if (dto.rentalYield !== undefined) data.rentalYield = new Decimal(dto.rentalYield);

    // If seller re-submits a rejected property, set back to pending
    if (!isAdmin && property.status === 'rejected') {
      data.status = 'pending';
    }

    const updated = await this.prisma.property.update({ where: { id }, data });

    await this.auditService.log({
      userId,
      action: 'update_property',
      entityType: 'property',
      entityId: id,
      ipAddress: ip,
    });

    return updated;
  }

  async delete(id: number, userId: number, userRole: string, ip?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { _count: { select: { investments: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');

    const isAdmin = ['admin', 'operations_manager'].includes(userRole);
    if (!isAdmin && property.sellerId !== userId) {
      throw new ForbiddenException('Not authorized to delete this property');
    }

    // Cannot delete properties with existing investments
    if (property._count.investments > 0) {
      throw new BadRequestException('Cannot delete a property that has investments');
    }

    await this.prisma.property.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'delete_property',
      entityType: 'property',
      entityId: id,
      ipAddress: ip,
    });

    return { message: 'Property deleted successfully' };
  }

  async getSellerProperties(sellerId: number) {
    return this.prisma.property.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { investments: true } },
      },
    });
  }

  // Admin

  async getPending() {
    return this.prisma.property.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: {
        seller: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateStatus(
    id: number,
    dto: UpdatePropertyStatusDto,
    adminId: number,
    ip?: string,
  ) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');

    const updated = await this.prisma.property.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditService.log({
      userId: adminId,
      action: `property_${dto.status}`,
      entityType: 'property',
      entityId: id,
      details: { reason: dto.reason },
      ipAddress: ip,
    });

    return updated;
  }
}
