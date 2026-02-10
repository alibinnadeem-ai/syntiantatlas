import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateTicketReplyDto,
  QueryTicketsDto,
  AdminQueryTicketsDto,
} from './dto/tickets.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a support ticket' })
  async create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List my support tickets' })
  async findAll(
    @Query() query: QueryTicketsDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.findUserTickets(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a support ticket by ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.findOneForUser(id, user.id);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a support ticket' })
  async addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTicketReplyDto,
    @CurrentUser() user: any,
  ) {
    // Verify user owns this ticket before allowing reply
    await this.ticketsService.findOneForUser(id, user.id);
    return this.ticketsService.addReply(id, user.id, dto.message);
  }
}

@ApiTags('Admin - Tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'operations_manager', 'staff')
@Controller('admin/tickets')
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'List all support tickets (admin)' })
  async findAll(@Query() query: AdminQueryTicketsDto) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get support ticket detail (admin)' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a support ticket (admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.ticketsService.update(id, dto, admin.id, req.ip);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Add a staff reply to a ticket (admin)' })
  async addReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTicketReplyDto,
    @CurrentUser() admin: any,
  ) {
    return this.ticketsService.addReply(id, admin.id, dto.message);
  }

  @Put(':id/close')
  @ApiOperation({ summary: 'Close a support ticket (admin)' })
  async close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: any,
    @Req() req: Request,
  ) {
    return this.ticketsService.close(id, admin.id, req.ip);
  }
}
