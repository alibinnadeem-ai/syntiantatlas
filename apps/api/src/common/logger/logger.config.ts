import * as winston from 'winston';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';

/**
 * Creates Winston logger configuration for the NestJS application.
 *
 * - Development: colorized, human-readable console output
 * - Production: JSON structured logging with file transports
 */
export function createWinstonLogger(logLevel: string, nodeEnv: string) {
  const isProduction = nodeEnv === 'production';

  const developmentFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.ms(),
    nestWinstonModuleUtilities.format.nestLike('SyntiantAtlas', {
      colors: true,
      prettyPrint: true,
    }),
  );

  const productionFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: isProduction ? productionFormat : developmentFormat,
    }),
  ];

  if (isProduction) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: productionFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: productionFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: logLevel,
    transports,
  });
}
