import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in dollars', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'usd' })
  @IsString()
  @IsOptional()
  currency?: string = 'usd';

  @ApiPropertyOptional({ description: 'Stripe payment method ID (pm_...)' })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class AttachPaymentMethodDto {
  @ApiProperty({ description: 'Stripe payment method ID (pm_...)' })
  @IsString()
  paymentMethodId: string;
}

export class CreateWithdrawalDto {
  @ApiProperty({ description: 'Withdrawal amount in dollars', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'Stripe payment method ID for refund-to-card',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class QueryPaymentMethodsDto {}
