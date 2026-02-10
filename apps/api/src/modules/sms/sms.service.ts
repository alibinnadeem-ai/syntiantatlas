import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendSmsResult {
  success: boolean;
  messageSid?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;
  private enabled = true;

  constructor(private config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER') || '';

    const missing = [
      !this.accountSid || this.accountSid === 'PLACEHOLDER'
        ? 'TWILIO_ACCOUNT_SID'
        : null,
      !this.authToken || this.authToken === 'PLACEHOLDER'
        ? 'TWILIO_AUTH_TOKEN'
        : null,
      !this.fromNumber || this.fromNumber === 'PLACEHOLDER'
        ? 'TWILIO_PHONE_NUMBER'
        : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      this.enabled = false;
      this.logger.warn(
        `SMS sending is disabled. Missing or placeholder env vars: ${missing.join(', ')}. ` +
          'SMS messages will be logged to the console instead of being sent.',
      );
    } else {
      this.logger.log('Twilio SMS transport configured');
    }
  }

  // ---------------------------------------------------------------------------
  // Core send method
  // ---------------------------------------------------------------------------

  async sendSms(to: string, message: string): Promise<SendSmsResult> {
    if (!this.enabled) {
      this.logger.debug(
        `[DEV] SMS that would be sent:\n  To: ${to}\n  Body: ${message}`,
      );
      return { success: false };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const credentials = Buffer.from(
        `${this.accountSid}:${this.authToken}`,
      ).toString('base64');

      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber,
        Body: message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Twilio API error (${response.status}): ${errorBody}`,
        );
        return { success: false };
      }

      const data = (await response.json()) as { sid?: string };
      this.logger.log(`SMS sent to ${to} (SID: ${data.sid})`);
      return { success: true, messageSid: data.sid };
    } catch (error: any) {
      this.logger.error(
        `Failed to send SMS to ${to}: ${error?.message}`,
        error?.stack,
      );
      return { success: false };
    }
  }

  // ---------------------------------------------------------------------------
  // Notification helpers
  // ---------------------------------------------------------------------------

  async sendVerificationCode(
    phone: string,
    code: string,
  ): Promise<SendSmsResult> {
    const message = `Your Syntiant Atlas verification code is: ${code}. Valid for 10 minutes.`;
    return this.sendSms(phone, message);
  }

  async sendInvestmentAlert(
    phone: string,
    propertyTitle: string,
    amount: number,
  ): Promise<SendSmsResult> {
    const formatted = formatCurrency(amount);
    const message = `Syntiant Atlas: Your investment of ${formatted} in ${propertyTitle} is confirmed.`;
    return this.sendSms(phone, message);
  }

  async sendDividendAlert(
    phone: string,
    amount: number,
  ): Promise<SendSmsResult> {
    const formatted = formatCurrency(amount);
    const message = `Syntiant Atlas: A dividend of ${formatted} has been credited to your wallet.`;
    return this.sendSms(phone, message);
  }

  async sendSecurityAlert(
    phone: string,
    action: string,
  ): Promise<SendSmsResult> {
    const message = `Syntiant Atlas Security: ${action}. If this wasn't you, contact support immediately.`;
    return this.sendSms(phone, message);
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
