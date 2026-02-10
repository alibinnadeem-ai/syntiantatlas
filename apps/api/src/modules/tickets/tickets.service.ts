import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  QueryTicketsDto,
  AdminQueryTicketsDto,
} from './dto/tickets.dto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateTicketDto, userId: number) {
    const ticket = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        priority: dto.priority || 'medium',
        status: 'pending',
        relatedEntityType: dto.relatedEntityType || 'support_ticket',
        relatedEntityId: dto.relatedEntityId || null,
        assignedBy: userId,
      },
    });

    this.logger.log(`User ${userId} created support ticket #${ticket.id}`);

    return ticket;
  }

  async findUserTickets(userId: number, query: QueryTicketsDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      assignedBy: userId,
      relatedEntityType: 'support_ticket',
    };

    const [tickets, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedToUser: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const ticket = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    return ticket;
  }

  async findOneForUser(id: number, userId: number) {
    const ticket = await this.findOne(id);

    if (ticket.assignedBy !== userId) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return ticket;
  }

  async addReply(taskId: number, userId: number, message: string) {
    const ticket = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    const reply = await this.prisma.ticketReply.create({
      data: {
        taskId,
        userId,
        message,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // If ticket was pending or closed, reopen it when user replies
    if (ticket.assignedBy === userId && ['pending', 'closed'].includes(ticket.status || '')) {
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: 'open', updatedAt: new Date() },
      });
    }

    // Update ticket's updatedAt timestamp
    await this.prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    });

    return reply;
  }

  async findAll(query: AdminQueryTicketsDto) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      relatedEntityType: 'support_ticket',
    };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedTo) where.assignedTo = query.assignedTo;

    const [tickets, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedToUser: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: number, dto: UpdateTicketDto, adminId: number, ip?: string) {
    const ticket = await this.prisma.task.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const data: any = { updatedAt: new Date() };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;

    const updated = await this.prisma.task.update({ where: { id }, data });

    await this.auditService.log({
      userId: adminId,
      action: 'update_ticket',
      entityType: 'task',
      entityId: id,
      details: { changes: dto },
      ipAddress: ip,
    });

    return updated;
  }

  async close(id: number, adminId: number, ip?: string) {
    const ticket = await this.prisma.task.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'closed',
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'close_ticket',
      entityType: 'task',
      entityId: id,
      ipAddress: ip,
    });

    return updated;
  }
}
