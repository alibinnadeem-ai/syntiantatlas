import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
import Stripe from 'stripe';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePaymentIntentDto,
  CreateWithdrawalDto,
} from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;
  private webhookSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );

    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia' as any,
      });
      this.logger.log('Stripe initialized');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY not set — running in mock mode. Payment operations will fail.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private ensureStripe(): Stripe {
    if (!this.stripe) {
      throw new BadRequestException(
        'Stripe is not configured. Payment operations are unavailable.',
      );
    }
    return this.stripe;
  }

  /**
   * Retrieve or create a Stripe Customer associated with the given user.
   * Uses the user email as the lookup key via Stripe search.
   */
  private async getOrCreateStripeCustomer(
    userId: number,
  ): Promise<Stripe.Customer> {
    const stripe = this.ensureStripe();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Look up customer by metadata userId to avoid duplicates
    const existing = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      return existing.data[0];
    }

    // Create a new customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      metadata: { userId: String(user.id) },
    });

    this.logger.log(
      `Created Stripe customer ${customer.id} for user ${user.id}`,
    );

    return customer;
  }

  // ---------------------------------------------------------------------------
  // Payment Intents
  // ---------------------------------------------------------------------------

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    userId: number,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const stripe = this.ensureStripe();

    const customer = await this.getOrCreateStripeCustomer(userId);

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(dto.amount * 100), // convert to cents
      currency: dto.currency || 'usd',
      customer: customer.id,
      metadata: {
        userId: String(userId),
        type: 'deposit',
      },
    };

    if (dto.paymentMethodId) {
      intentParams.payment_method = dto.paymentMethodId;
    }

    const intent = await stripe.paymentIntents.create(intentParams);

    this.logger.log(
      `Created PaymentIntent ${intent.id} for user ${userId} — $${dto.amount}`,
    );

    await this.auditService.log({
      userId,
      action: 'payment_intent_created',
      entityType: 'payment_intent',
      details: {
        paymentIntentId: intent.id,
        amount: dto.amount,
        currency: dto.currency || 'usd',
      },
    });

    return {
      clientSecret: intent.client_secret!,
      paymentIntentId: intent.id,
    };
  }

  // ---------------------------------------------------------------------------
  // Webhooks
  // ---------------------------------------------------------------------------

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const stripe = this.ensureStripe();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
        break;
    }
  }

  private async handlePaymentIntentSucceeded(
    intent: Stripe.PaymentIntent,
  ): Promise<void> {
    const userId = intent.metadata?.userId
      ? parseInt(intent.metadata.userId, 10)
      : null;

    if (!userId) {
      this.logger.warn(
        `PaymentIntent ${intent.id} succeeded but has no userId metadata`,
      );
      return;
    }

    const amount = new Decimal(intent.amount).dividedBy(100); // cents to dollars
    const refNumber = `DEP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    await this.prisma.$transaction(async (tx) => {
      // Create completed transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'deposit',
          amount,
          status: 'completed',
          gateway: 'stripe',
          paymentMethod: 'card',
          referenceNumber: refNumber,
          description: `Stripe deposit — ${intent.id}`,
        },
      });

      // Credit user wallet
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: amount },
        },
      });
    });

    this.logger.log(
      `Deposit completed for user ${userId}: $${amount} (${intent.id})`,
    );

    // Send notification
    await this.notificationsService.create(
      userId,
      'deposit',
      'Deposit Successful',
      `Your deposit of $${amount} has been credited to your wallet.`,
      { paymentIntentId: intent.id, amount: amount.toString() },
    );

    await this.auditService.log({
      userId,
      action: 'deposit_completed',
      entityType: 'transaction',
      details: {
        paymentIntentId: intent.id,
        amount: amount.toString(),
        gateway: 'stripe',
      },
    });
  }

  private async handlePaymentIntentFailed(
    intent: Stripe.PaymentIntent,
  ): Promise<void> {
    const userId = intent.metadata?.userId
      ? parseInt(intent.metadata.userId, 10)
      : null;

    if (!userId) {
      this.logger.warn(
        `PaymentIntent ${intent.id} failed but has no userId metadata`,
      );
      return;
    }

    const amount = new Decimal(intent.amount).dividedBy(100);
    const refNumber = `DEP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'deposit',
        amount,
        status: 'failed',
        gateway: 'stripe',
        paymentMethod: 'card',
        referenceNumber: refNumber,
        description: `Failed Stripe deposit — ${intent.id}`,
      },
    });

    this.logger.warn(
      `Deposit failed for user ${userId}: $${amount} (${intent.id})`,
    );

    // Send notification
    await this.notificationsService.create(
      userId,
      'deposit',
      'Deposit Failed',
      `Your deposit of $${amount} could not be processed. Please try again or use a different payment method.`,
      {
        paymentIntentId: intent.id,
        amount: amount.toString(),
        failureMessage: intent.last_payment_error?.message,
      },
    );

    await this.auditService.log({
      userId,
      action: 'deposit_failed',
      entityType: 'transaction',
      details: {
        paymentIntentId: intent.id,
        amount: amount.toString(),
        failureMessage: intent.last_payment_error?.message,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Payment Methods
  // ---------------------------------------------------------------------------

  async attachPaymentMethod(
    paymentMethodId: string,
    userId: number,
  ) {
    const stripe = this.ensureStripe();

    const customer = await this.getOrCreateStripeCustomer(userId);

    // Attach the payment method to the customer in Stripe
    const pm = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Check if user already has payment methods to determine default
    const existingCount = await this.prisma.paymentMethod.count({
      where: { userId },
    });

    const isFirst = existingCount === 0;

    // If it is the first method, also set as default on Stripe customer
    if (isFirst) {
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Extract card details
    const card = pm.card;

    const record = await this.prisma.paymentMethod.create({
      data: {
        userId,
        type: pm.type || 'card',
        provider: 'stripe',
        externalId: pm.id,
        last4: card?.last4 || null,
        brand: card?.brand || null,
        expiryMonth: card?.exp_month || null,
        expiryYear: card?.exp_year || null,
        isDefault: isFirst,
      },
    });

    this.logger.log(
      `Attached payment method ${pm.id} for user ${userId} (default: ${isFirst})`,
    );

    await this.auditService.log({
      userId,
      action: 'payment_method_attached',
      entityType: 'payment_method',
      entityId: record.id,
      details: {
        stripePaymentMethodId: pm.id,
        type: pm.type,
        last4: card?.last4,
        brand: card?.brand,
      },
    });

    return record;
  }

  async getPaymentMethods(userId: number) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async removePaymentMethod(paymentMethodId: number, userId: number) {
    const stripe = this.ensureStripe();

    const method = await this.prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // Detach from Stripe
    try {
      await stripe.paymentMethods.detach(method.externalId);
    } catch (err: any) {
      this.logger.warn(
        `Failed to detach Stripe payment method ${method.externalId}: ${err.message}`,
      );
    }

    await this.prisma.paymentMethod.delete({
      where: { id: method.id },
    });

    this.logger.log(
      `Removed payment method ${method.id} (${method.externalId}) for user ${userId}`,
    );

    await this.auditService.log({
      userId,
      action: 'payment_method_removed',
      entityType: 'payment_method',
      entityId: method.id,
      details: { stripePaymentMethodId: method.externalId },
    });

    return { message: 'Payment method removed' };
  }

  async setDefaultPaymentMethod(paymentMethodId: number, userId: number) {
    const stripe = this.ensureStripe();

    const method = await this.prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    });

    if (!method) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset all existing defaults for this user
    await this.prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set the new default
    await this.prisma.paymentMethod.update({
      where: { id: method.id },
      data: { isDefault: true },
    });

    // Update default on Stripe customer
    const customer = await this.getOrCreateStripeCustomer(userId);
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: method.externalId },
    });

    this.logger.log(
      `Set payment method ${method.id} as default for user ${userId}`,
    );

    await this.auditService.log({
      userId,
      action: 'payment_method_default_changed',
      entityType: 'payment_method',
      entityId: method.id,
      details: { stripePaymentMethodId: method.externalId },
    });

    return { message: 'Default payment method updated' };
  }

  // ---------------------------------------------------------------------------
  // Withdrawals
  // ---------------------------------------------------------------------------

  async createWithdrawal(dto: CreateWithdrawalDto, userId: number) {
    const amount = new Decimal(dto.amount);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balance = user.walletBalance || new Decimal(0);

    if (balance.lessThan(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const refNumber = `WDR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const transaction = await this.prisma.$transaction(async (tx) => {
      // Deduct from wallet immediately
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: amount },
        },
      });

      // Create pending withdrawal transaction
      const txn = await tx.transaction.create({
        data: {
          userId,
          type: 'withdrawal',
          amount,
          status: 'pending',
          gateway: 'stripe',
          paymentMethod: dto.paymentMethodId || 'bank_transfer',
          referenceNumber: refNumber,
          description: `Withdrawal of $${amount}`,
        },
      });

      return txn;
    });

    this.logger.log(
      `Withdrawal created for user ${userId}: $${amount} (${refNumber})`,
    );

    await this.notificationsService.create(
      userId,
      'withdrawal',
      'Withdrawal Requested',
      `Your withdrawal of $${amount} is being processed. Reference: ${refNumber}`,
      { transactionId: transaction.id, amount: amount.toString() },
    );

    await this.auditService.log({
      userId,
      action: 'withdrawal_created',
      entityType: 'transaction',
      entityId: transaction.id,
      details: { amount: dto.amount, referenceNumber: refNumber },
    });

    return transaction;
  }
}
