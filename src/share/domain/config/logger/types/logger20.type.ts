export enum LogLevel {
  INFO = 'info',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export interface LogMetadata {
  methodName?: string;
  processingTime?: string;
  request?: any;
  response?: any;
  message?: string;
  transactionId?: string;
  level?: LogLevel;
  timestamp?: string;
}

export interface StartProcessMetadata {
  methodName?: string;
  request?: any;
  [key: string]: any;
}

export interface ProcessLogger {
  endProcess: (
    endMessage?: string,
    endMeta?: LogMetadata,
    level?: LogLevel,
  ) => void;
}
