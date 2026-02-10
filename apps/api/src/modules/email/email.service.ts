import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { wrapInTemplate } from './email.templates';

interface SendEmailResult {
  success: boolean;
  messageId?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    this.fromEmail =
      this.config.get<string>('SENDGRID_FROM_EMAIL') ||
      'noreply@syntiantatlas.com';

    if (apiKey) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: apiKey,
        },
      });
      this.logger.log('Email transport configured with SendGrid');
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY is not set. Emails will be logged to the console instead of being sent.',
      );
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Core send method
  // ---------------------------------------------------------------------------

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<SendEmailResult> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Syntiant Atlas" <${this.fromEmail}>`,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      };

      const info = await this.transporter.sendMail(mailOptions);

      // When using jsonTransport (no API key), log the email for dev visibility
      if (!this.config.get<string>('SENDGRID_API_KEY')) {
        this.logger.debug(
          `[DEV] Email that would be sent:\n  To: ${to}\n  Subject: ${subject}`,
        );
      }

      this.logger.log(`Email sent to ${to}: ${subject}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${to}: ${error?.message}`,
        error?.stack,
      );
      return { success: false };
    }
  }

  // ---------------------------------------------------------------------------
  // Transactional email templates
  // ---------------------------------------------------------------------------

  async sendWelcomeEmail(
    email: string,
    firstName: string,
  ): Promise<SendEmailResult> {
    const subject = 'Welcome to Syntiant Atlas';
    const html = wrapInTemplate(
      subject,
      `
      <h2>Welcome aboard, ${esc(firstName)}!</h2>
      <p>Thank you for creating your Syntiant Atlas account. We are excited to have you join our community of real estate investors.</p>
      <p>With Syntiant Atlas you can:</p>
      <ul style="color: #4a5568; padding-left: 20px; margin-bottom: 14px;">
        <li style="margin-bottom: 6px;">Browse curated, high-quality real estate investment opportunities</li>
        <li style="margin-bottom: 6px;">Invest fractionally with amounts that work for you</li>
        <li style="margin-bottom: 6px;">Earn quarterly dividend payouts from rental income</li>
        <li style="margin-bottom: 6px;">Track your portfolio performance in real time</li>
      </ul>
      <p>To get started, complete your profile and verify your identity so you can begin investing right away.</p>
      <p style="text-align: center;">
        <a href="https://syntiantatlas.com/dashboard" class="btn" style="display: inline-block; background-color: #1a2744; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">Go to Dashboard</a>
      </p>
      <p style="color: #8898a8; font-size: 13px; margin-top: 24px;">If you did not create this account, please disregard this email.</p>
      `,
    );

    return this.sendEmail(email, subject, html);
  }

  async sendDividendNotification(
    email: string,
    firstName: string,
    propertyTitle: string,
    amount: number,
    quarter: string,
    year: number,
  ): Promise<SendEmailResult> {
    const formattedAmount = formatCurrency(amount);
    const subject = `Dividend Payout: ${formattedAmount} from ${propertyTitle}`;
    const html = wrapInTemplate(
      subject,
      `
      <h2>Dividend Payout Received</h2>
      <p>Hi ${esc(firstName)},</p>
      <p>Great news! A dividend payout has been credited to your Syntiant Atlas account.</p>
      <div class="highlight-box" style="background-color: #f0f4ff; border-left: 4px solid #1a2744; padding: 16px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 4px 0; color: #1a2744; font-weight: 500;">Property: ${esc(propertyTitle)}</p>
        <p style="margin: 4px 0; color: #1a2744; font-weight: 500;">Period: ${esc(quarter)} ${year}</p>
        <p style="margin: 4px 0; color: #1a2744; font-weight: 600; font-size: 18px;">Amount: ${formattedAmount}</p>
      </div>
      <p>The funds are now available in your wallet balance. You can reinvest or withdraw at any time.</p>
      <p style="text-align: center;">
        <a href="https://syntiantatlas.com/wallet" class="btn" style="display: inline-block; background-color: #1a2744; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">View Wallet</a>
      </p>
      `,
    );

    return this.sendEmail(email, subject, html);
  }

  async sendInvestmentConfirmation(
    email: string,
    firstName: string,
    propertyTitle: string,
    amount: number,
    shares: number,
  ): Promise<SendEmailResult> {
    const formattedAmount = formatCurrency(amount);
    const subject = `Investment Confirmed: ${esc(propertyTitle)}`;
    const html = wrapInTemplate(
      subject,
      `
      <h2>Investment Confirmation</h2>
      <p>Hi ${esc(firstName)},</p>
      <p>Your investment has been successfully processed. Here are the details:</p>
      <div class="highlight-box" style="background-color: #f0f4ff; border-left: 4px solid #1a2744; padding: 16px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 4px 0; color: #1a2744; font-weight: 500;">Property: ${esc(propertyTitle)}</p>
        <p style="margin: 4px 0; color: #1a2744; font-weight: 500;">Shares Purchased: ${shares}</p>
        <p style="margin: 4px 0; color: #1a2744; font-weight: 600; font-size: 18px;">Total Amount: ${formattedAmount}</p>
      </div>
      <p>You will begin receiving dividend payouts for this property at the end of the next qualifying quarter.</p>
      <p style="text-align: center;">
        <a href="https://syntiantatlas.com/portfolio" class="btn" style="display: inline-block; background-color: #1a2744; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">View Portfolio</a>
      </p>
      `,
    );

    return this.sendEmail(email, subject, html);
  }

  async sendWithdrawalConfirmation(
    email: string,
    firstName: string,
    amount: number,
    status: string,
  ): Promise<SendEmailResult> {
    const formattedAmount = formatCurrency(amount);
    const subject = `Withdrawal Request: ${formattedAmount} - ${capitalize(status)}`;

    const statusMessages: Record<string, string> = {
      pending:
        'Your withdrawal request has been submitted and is being reviewed. You will receive a follow-up email once it has been processed.',
      processing:
        'Your withdrawal is currently being processed. Funds typically arrive within 2-5 business days.',
      completed:
        'Your withdrawal has been completed and the funds have been sent to your linked bank account.',
      rejected:
        'Unfortunately, your withdrawal request could not be processed. Please check your account details and try again, or contact support for assistance.',
    };

    const statusBadgeClass =
      status === 'completed'
        ? 'status-approved'
        : status === 'rejected'
          ? 'status-rejected'
          : 'status-pending';

    const html = wrapInTemplate(
      subject,
      `
      <h2>Withdrawal Update</h2>
      <p>Hi ${esc(firstName)},</p>
      <div class="highlight-box" style="background-color: #f0f4ff; border-left: 4px solid #1a2744; padding: 16px 20px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 4px 0; color: #1a2744; font-weight: 600; font-size: 18px;">Amount: ${formattedAmount}</p>
        <p style="margin: 8px 0 4px 0; color: #1a2744; font-weight: 500;">
          Status: <span class="${statusBadgeClass}" style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; text-transform: uppercase;">${capitalize(status)}</span>
        </p>
      </div>
      <p>${statusMessages[status] || statusMessages['pending']}</p>
      <p style="text-align: center;">
        <a href="https://syntiantatlas.com/wallet" class="btn" style="display: inline-block; background-color: #1a2744; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">View Wallet</a>
      </p>
      `,
    );

    return this.sendEmail(email, subject, html);
  }

  async sendKycStatusUpdate(
    email: string,
    firstName: string,
    status: string,
    reason?: string,
  ): Promise<SendEmailResult> {
    const approved = status.toLowerCase() === 'approved';
    const subject = `Identity Verification ${approved ? 'Approved' : 'Update Required'}`;

    const statusBadgeClass = approved ? 'status-approved' : 'status-rejected';
    const reasonBlock = reason
      ? `<p style="margin-top: 12px; color: #4a5568;"><strong>Reason:</strong> ${esc(reason)}</p>`
      : '';

    const bodyMessage = approved
      ? '<p>Your identity verification has been approved. You now have full access to invest in properties on Syntiant Atlas.</p>'
      : `<p>We were unable to verify your identity with the documents provided. Please review the reason below and re-submit your verification.</p>${reasonBlock}`;

    const ctaHref = approved
      ? 'https://syntiantatlas.com/marketplace'
      : 'https://syntiantatlas.com/settings/kyc';
    const ctaLabel = approved ? 'Browse Properties' : 'Re-submit Verification';

    const html = wrapInTemplate(
      subject,
      `
      <h2>Identity Verification</h2>
      <p>Hi ${esc(firstName)},</p>
      <p>
        Status: <span class="${statusBadgeClass}" style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; text-transform: uppercase;">${capitalize(status)}</span>
      </p>
      ${bodyMessage}
      <p style="text-align: center; margin-top: 20px;">
        <a href="${ctaHref}" class="btn" style="display: inline-block; background-color: #1a2744; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">${ctaLabel}</a>
      </p>
      `,
    );

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetLink: string,
  ): Promise<SendEmailResult> {
    const subject = 'Reset Your Password - Syntiant Atlas';
    const html = wrapInTemplate(
      subject,
      `
      <h2>Password Reset Request</h2>
      <p>Hi ${esc(firstName)},</p>
      <p>We received a request to reset the password for your Syntiant Atlas account. Click the button below to choose a new password:</p>
      <p style="text-align: center;">
        <a href="${esc(resetLink)}" class="btn" style="display: inline-block; background-color: #1a2744; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;">Reset Password</a>
      </p>
      <p style="color: #8898a8; font-size: 13px;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.</p>
      <p style="color: #8898a8; font-size: 13px; word-break: break-all;">If the button above does not work, copy and paste this URL into your browser:<br />${esc(resetLink)}</p>
      `,
    );

    return this.sendEmail(email, subject, html);
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function esc(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
