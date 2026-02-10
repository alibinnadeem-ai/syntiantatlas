import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);
  private readonly isInitialized: boolean;

  constructor(private readonly configService: ConfigService) {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (!dsn) {
      this.logger.warn(
        'SENTRY_DSN not configured — Sentry error tracking is disabled',
      );
      this.isInitialized = false;
      return;
    }

    Sentry.init({
      dsn,
      environment: nodeEnv,
      tracesSampleRate: nodeEnv === 'production' ? 0.2 : 1.0,
      debug: nodeEnv !== 'production',
    });

    this.isInitialized = true;
    this.logger.log(
      `Sentry initialized for environment: ${nodeEnv}`,
    );
  }

  /**
   * Report an exception to Sentry with optional context and tags.
   */
  captureException(
    error: Error | unknown,
    context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
  ): void {
    if (!this.isInitialized) return;

    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }

  /**
   * Report a message to Sentry.
   */
  captureMessage(
    message: string,
    level?: Sentry.Severity,
    context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
  ): void {
    if (!this.isInitialized) return;

    Sentry.withScope((scope) => {
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Set user context for subsequent Sentry events.
   */
  setUser(user: Sentry.User | null): void {
    if (!this.isInitialized) return;
    Sentry.configureScope((scope) => {
      scope.setUser(user);
    });
  }

  /**
   * Add a breadcrumb to the Sentry trail.
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.isInitialized) return;
    Sentry.addBreadcrumb(breadcrumb);
  }
}
