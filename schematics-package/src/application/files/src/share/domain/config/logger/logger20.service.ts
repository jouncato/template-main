import { LoggerService } from '@nestjs/common';

import * as winston from 'winston';

import { SERVICE_NAME } from '../../resources/constants';
import { createTimer } from '../createTimer';
import { processDataForLogging } from '../decorators/logExecutionAndCatch.decorator';
import { als } from '../txid/als';

import {
  LogLevel,
  LogMetadata,
  ProcessLogger,
  StartProcessMetadata,
} from './types/logger20.type';

/**
 * @description Custom logger implementation for logs 2.0  with winston package
 *
 * @autor Fábrica Microservicios
 *
 * @date Julio 2022
 */

export class Logger20Service implements LoggerService {
  loggerWinston: winston.Logger;

  constructor() {
    this.loggerWinston = winston.createLogger({
      format: winston.format.json(),
      defaultMeta: { applicationName: `${SERVICE_NAME}` },
      transports: [new winston.transports.Console()],
    });
  }

  private winLog(
    level: LogLevel,
    message: string,
    meta?: LogMetadata,
    context?: string,
  ) {
    const metadata = typeof meta === 'object' ? meta : undefined;
    const transactionId = als.getStore()?.txId;

    if (metadata?.request) {
      metadata.request = processDataForLogging(metadata.request);
    }

    if (metadata?.response) {
      metadata.response = processDataForLogging(metadata.response);
    }

    const logMetadata: LogMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      methodName: context || metadata?.methodName,
      transactionId,
      processingTime: metadata?.processingTime ?? '0ms',
    };

    this.loggerWinston.log(level, message, logMetadata);
  }

  /**
   * Write a 'info' level log.
   */
  log(message: string, meta?: LogMetadata, context?: string) {
    this.winLog(LogLevel.INFO, message, meta, context);
  }

  /**
   * Write a 'error' level log.
   */
  error(message: string, meta?: LogMetadata, context?: string) {
    this.winLog(LogLevel.ERROR, message, meta, context);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: string, meta?: LogMetadata, context?: string) {
    this.winLog(LogLevel.WARN, message, meta, context);
  }

  /**
   * Write a 'debug' level log.
   */
  debug?(message: string, meta?: LogMetadata, context?: string) {
    this.winLog(LogLevel.DEBUG, message, meta, context);
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: string, meta?: LogMetadata, context?: string) {
    this.winLog(LogLevel.VERBOSE, message, meta, context);
  }

  /**
   * Log del inicio de un proceso y retorna función para logear el fin con process time
   */
  startProcess(
    message: string,
    meta?: StartProcessMetadata,
    context?: string,
  ): ProcessLogger {
    this.winLog(
      LogLevel.INFO,
      `INICIO: ${message}`,
      {
        ...meta,
        processingTime: '0ms',
      },
      context,
    );
    const timer = createTimer();

    return {
      endProcess: (
        endMessage?: string,
        endMeta?: LogMetadata,
        endLevel?: LogLevel,
      ) => {
        const processingTime = timer.end();
        const finalMessage = endMessage || message;
        this.winLog(
          endLevel || LogLevel.INFO,
          `FIN: ${finalMessage}`,
          {
            ...meta,
            ...endMeta,
            processingTime,
          },
          context,
        );
      },
    };
  }
}
