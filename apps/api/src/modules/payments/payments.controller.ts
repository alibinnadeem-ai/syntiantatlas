import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  ParseIntPipe,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  AttachPaymentMethodDto,
  CreateWithdrawalDto,
} from './dto/payments.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ---------------------------------------------------------------------------
  // Payment Intents
  // ---------------------------------------------------------------------------

  @Post('intent')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe payment intent for deposit' })
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createPaymentIntent(dto, user.id);
  }

  // ---------------------------------------------------------------------------
  // Stripe Webhook (NO auth guard — validated via Stripe signature)
  // ---------------------------------------------------------------------------

  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new Error(
        'Raw body is not available. Ensure rawBody parsing is enabled in NestJS.',
      );
    }

    await this.paymentsService.handleWebhook(rawBody, signature);

    return { received: true };
  }

  // ---------------------------------------------------------------------------
  // Payment Methods
  // ---------------------------------------------------------------------------

  @Post('methods')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach a Stripe payment method to your account' })
  async attachPaymentMethod(
    @Body() dto: AttachPaymentMethodDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.attachPaymentMethod(dto.paymentMethodId, user.id);
  }

  @Get('methods')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List your saved payment methods' })
  async getPaymentMethods(@CurrentUser() user: any) {
    return this.paymentsService.getPaymentMethods(user.id);
  }

  @Delete('methods/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a saved payment method' })
  async removePaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.removePaymentMethod(id, user.id);
  }

  @Put('methods/:id/default')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a payment method as default' })
  async setDefaultPaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.setDefaultPaymentMethod(id, user.id);
  }

  // ---------------------------------------------------------------------------
  // Withdrawals
  // ---------------------------------------------------------------------------

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a withdrawal from your wallet' })
  async createWithdrawal(
    @Body() dto: CreateWithdrawalDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.createWithdrawal(dto, user.id);
  }
}
