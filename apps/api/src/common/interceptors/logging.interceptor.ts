import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        this.logger.log(
          JSON.stringify({
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            userAgent,
            ip,
          }),
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;

        this.logger.error(
          JSON.stringify({
            method,
            url,
            duration: `${duration}ms`,
            userAgent,
            ip,
            error: error.message,
            stack: error.stack,
          }),
        );

        return throwError(() => error);
      }),
    );
  }
}
