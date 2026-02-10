import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { DepositDto, WithdrawDto, QueryTransactionsDto } from './dto/transactions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds into wallet' })
  async deposit(
    @Body() dto: DepositDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.transactionsService.deposit(dto, user.id, req.ip);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  async withdraw(
    @Body() dto: WithdrawDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.transactionsService.withdraw(dto, user.id, req.ip);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get transaction history with summary' })
  async getHistory(
    @CurrentUser() user: any,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.transactionsService.getHistory(user.id, query);
  }
}
