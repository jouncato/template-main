import { HttpStatus, Logger } from '@nestjs/common';

import apm from 'elastic-apm-node';
import { v4 as uuidv4 } from 'uuid';

import { ApiResponseDto } from '../../dto/apiResponse.dto';
import { createTimer, ProcessTime } from '../createTimer';
import { LogLevel, LogMetadata } from '../logger/types/logger20.type';
import { als } from '../txid/als';

interface ExecutionContext {
  logger: Logger;
  processTime: ProcessTime;
  activeTransactionId: string;
  className: string;
  componentType: string;
  propertyKey: string;
  requestData: Record<string, unknown>;
}

interface StandardLogConfig {
  methodName: string;
  transactionId: string;
  request: Record<string, unknown>;
  response: unknown;
  level: 'INFO' | 'ERROR' | 'DEBUG';
  message: string;
  processingTime: string;
}

/**
 * Función para manejar JSON.stringify de forma segura evitando referencias circulares
 * @param obj - Objeto a serializar
 * @returns String JSON o mensaje de error
 */
function safeStringify(obj: unknown): string {
  const seen = new Set();

  try {
    return JSON.stringify(obj, (_key, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    });
  } catch {
    return '[Error serializing object]';
  }
}

/**
 * Obtiene el tamaño máximo permitido para logs desde variables de entorno
 */
function getMaxLogSize(): number | null {
  const envValue = process.env.MAX_LOG_SIZE;
  if (envValue && !isNaN(parseInt(envValue))) {
    return parseInt(envValue);
  }
  return null;
}

export function processDataForLogging(data: unknown): unknown {
  if (!data) return data;

  const sizeLimit = getMaxLogSize();

  try {
    const dataString = typeof data === 'string' ? data : safeStringify(data);

    if (!sizeLimit || dataString.length <= sizeLimit) {
      return data;
    }

    return dataString.slice(0, sizeLimit) + '... [truncated]';
  } catch {
    return data;
  }
}

function sanitizeLabelKey(key: string): string {
  return key
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
}

function isResponseObject(arg: Record<string, any>): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    arg &&
    typeof arg === 'object' &&
    (arg.code || arg.send || arg.status || arg.json)
  );
}

function isRequestObject(arg: Record<string, any>): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    arg &&
    typeof arg === 'object' &&
    (arg.method ||
      arg.url ||
      arg.headers ||
      arg.body ||
      arg.params ||
      arg.query)
  );
}

function extractRequestData(
  arg: Record<string, unknown>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (arg.body && Object.keys(arg.body).length > 0) {
    data.body = arg.body;
  }
  if (arg.params && Object.keys(arg.params).length > 0) {
    data.params = arg.params;
  }
  if (arg.query && Object.keys(arg.query).length > 0) {
    data.query = arg.query;
  }

  return data;
}

function processStringArgument(arg: string): Record<string, unknown> {
  try {
    return { body: JSON.parse(arg) as unknown };
  } catch {
    return { data: arg };
  }
}

function processArgument(
  arg: unknown,
  requestData: Record<string, unknown>,
): void {
  if (isResponseObject(arg as Record<string, unknown>)) {
    return; // Skip response objects
  }

  if (isRequestObject(arg as Record<string, unknown>)) {
    Object.assign(
      requestData,
      extractRequestData(arg as Record<string, unknown>),
    );
    return;
  }

  if (arg && typeof arg === 'object') {
    requestData.body = arg;
    return;
  }

  if (typeof arg === 'string') {
    Object.assign(requestData, processStringArgument(arg));
    return;
  }

  if (arg !== undefined && arg !== null) {
    requestData.value = arg;
  }
}

function handleRequest(args: unknown[]): Record<string, unknown> {
  const requestData: Record<string, unknown> = {};

  for (const arg of args) {
    processArgument(arg, requestData);
  }

  return Object.keys(requestData).length > 0 ? requestData : {};
}

export function createStandardLogEntry(config: StandardLogConfig): LogMetadata {
  return {
    methodName: config.methodName,
    transactionId: config.transactionId,
    request: processDataForLogging(config.request),
    response: processDataForLogging(config.response),
    level: config.level as LogLevel,
    message: config.message,
    processingTime: config.processingTime,
    timestamp: new Date().toISOString(),
  };
}

function determineComponentType(className: string): string {
  const lowerClassName = className.toLowerCase();

  if (lowerClassName.includes('controller')) return 'Controller';
  if (lowerClassName.includes('service')) return 'Service';
  if (lowerClassName.includes('repository')) return 'Repository';
  if (lowerClassName.includes('gateway')) return 'Gateway';
  if (lowerClassName.includes('provider')) return 'Provider';

  return 'Component';
}

function setObjectLabel(
  transaction: unknown,
  key: string,
  data: unknown,
): void {
  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    try {
      (
        transaction as { setLabel: (key: string, value: string) => void }
      ).setLabel(sanitizeLabelKey(key), safeStringify(data));
    } catch {
      (
        transaction as { setLabel: (key: string, value: string) => void }
      ).setLabel(sanitizeLabelKey(key), '[Object with circular references]');
    }
  }
}

function setPrimitiveLabel(
  transaction: unknown,
  key: string,
  value: unknown,
): void {
  if (value !== undefined) {
    (
      transaction as { setLabel: (key: string, value: string) => void }
    ).setLabel(sanitizeLabelKey(key), safeStringify(value));
  }
}

function setApmRequestLabels(
  transaction: unknown,
  requestData: Record<string, unknown>,
): void {
  // Set object labels
  setObjectLabel(transaction, 'request.body', requestData.body);
  setObjectLabel(transaction, 'request.params', requestData.params);
  setObjectLabel(transaction, 'request.query', requestData.query);

  // Set primitive labels
  setPrimitiveLabel(transaction, 'request.value', requestData.value);
  setPrimitiveLabel(transaction, 'request.data', requestData.data);
}

function setupApmTransaction(
  apmTransaction: unknown,
  componentType: string,
  className: string,
  propertyKey: string,
  activeTransactionId: string,
  requestData: Record<string, unknown>,
): void {
  if (!apmTransaction) return;

  const transaction = apmTransaction as {
    setLabel: (key: string, value: string) => void;
  };

  transaction.setLabel('component', componentType);
  transaction.setLabel('class', className);
  transaction.setLabel('method', propertyKey);
  transaction.setLabel(sanitizeLabelKey('transaction.id'), activeTransactionId);

  setApmRequestLabels(apmTransaction, requestData);
}

function handleApmError(
  error: Error,
  apmTransaction: unknown,
  shouldEndTransaction: boolean,
): void {
  if (apm.isStarted()) {
    apm.captureError(error);
    if (apmTransaction && shouldEndTransaction) {
      const transaction = apmTransaction as {
        setOutcome: (outcome: string) => void;
        end: () => void;
      };
      transaction.setOutcome('failure');
      transaction.end();
    }
  }
}

export function LogExecutionAndCatch(): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const executionContext = initializeExecutionContext(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this,
        propertyKey,
        args,
      );
      const { apmTransaction, shouldEndTransaction } =
        setupApmTracing(executionContext);

      try {
        logExecutionStart(executionContext);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const result = await originalMethod.apply(this, args);
        handleSuccessfulExecution(
          result,
          executionContext,
          apmTransaction,
          shouldEndTransaction,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
      } catch (error: unknown) {
        await handleExecutionError(
          error as Error,
          executionContext,
          apmTransaction,
          shouldEndTransaction,
        );
      }
    };

    return descriptor;
  };
}

function getOrCreateLogger(instance: Record<string, unknown>): Logger {
  return (
    (instance.logger as Logger) ??
    new Logger((instance.constructor as { name: string }).name)
  );
}

function getOrCreateTransactionId(instance: Record<string, unknown>): string {
  if (!instance.transactionId && !instance.currentTransactionId) {
    instance.transactionId = als.getStore()?.txId || uuidv4();
  }
  return (instance?.currentTransactionId as string) ?? instance.transactionId;
}

function initializeExecutionContext(
  instance: Record<string, unknown>,
  propertyKey: string,
  args: any[],
): ExecutionContext {
  const logger = getOrCreateLogger(instance);
  const processTime = createTimer();
  const activeTransactionId = getOrCreateTransactionId(instance);
  const className = instance.constructor.name;
  const componentType = determineComponentType(className);

  return {
    logger,
    processTime,
    activeTransactionId,
    className,
    componentType,
    propertyKey,
    requestData: handleRequest(args),
  };
}

function createNewApmTransaction(context: ExecutionContext): apm.Transaction {
  return apm.startTransaction(
    `${context.componentType}.${context.propertyKey}`,
    'request',
  );
}

function configureApmTransaction(
  apmTransaction: any,
  context: ExecutionContext,
): void {
  if (!apmTransaction) return;

  setupApmTransaction(
    apmTransaction,
    context.componentType,
    context.className,
    context.propertyKey,
    context.activeTransactionId,
    context.requestData,
  );
}

function setupApmTracing(context: ExecutionContext): {
  apmTransaction: apm.Transaction | null;
  shouldEndTransaction: boolean;
} {
  if (!apm.isStarted()) {
    return { apmTransaction: null, shouldEndTransaction: false };
  }

  let apmTransaction = apm.currentTransaction;
  let shouldEndTransaction = false;

  if (!apmTransaction) {
    apmTransaction = createNewApmTransaction(context);
    shouldEndTransaction = true;
  }

  configureApmTransaction(apmTransaction, context);

  return { apmTransaction, shouldEndTransaction };
}

function logExecutionStart(context: ExecutionContext): void {
  const startLogEntry = createStandardLogEntry({
    methodName: context.propertyKey,
    transactionId: context.activeTransactionId,
    request: context.requestData,
    response: '',
    level: 'INFO',
    message: `[${context.componentType}] Iniciando ejecución del método ${context.propertyKey} en ${context.className}`,
    processingTime: '0ms',
  });

  context.logger.log(
    `[${startLogEntry.level}] ${startLogEntry.message}`,
    startLogEntry,
  );
}

function handleSuccessfulExecution(
  result: any,
  context: ExecutionContext,
  apmTransaction: apm.Transaction | null,
  shouldEndTransaction: boolean,
): void {
  const processingTimeMs = context.processTime.end();

  const successLogEntry = createStandardLogEntry({
    methodName: context.propertyKey,
    transactionId: context.activeTransactionId,
    request: context.requestData,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    response: result?.data || result,
    level: 'INFO',
    message: `[${context.componentType}] Ejecución exitosa del método ${context.propertyKey} en ${context.className}`,
    processingTime: processingTimeMs,
  });

  context.logger.log(
    `[${successLogEntry.level}] ${successLogEntry.message}`,
    successLogEntry,
  );

  if (apmTransaction && shouldEndTransaction) {
    apmTransaction.setOutcome('success');
    apmTransaction.end();
  }
}

async function handleExecutionError(
  error: Error,
  context: ExecutionContext,
  apmTransaction: any,
  shouldEndTransaction: boolean,
): Promise<never> {
  handleApmError(error, apmTransaction, shouldEndTransaction);
  logExecutionError(error, context);

  if (error instanceof ApiResponseDto) {
    throw error;
  }

  throw new ApiResponseDto({
    responseCode: HttpStatus.INTERNAL_SERVER_ERROR,
    messageCode: 'INTERNAL_SERVER_ERROR',
    message:
      'Se está presentando un error de conexión, por favor intenta de nuevo',
    result: {
      message:
        'Se está presentando un error de conexión, por favor intenta de nuevo',
    },
  });
}

function logExecutionError(error: Error, context: ExecutionContext): void {
  const processingTimeMsError = context.processTime.end();

  const errorLogEntry = createStandardLogEntry({
    methodName: context.propertyKey,
    transactionId: context.activeTransactionId,
    request: context.requestData,
    response: {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    },
    level: 'ERROR',
    message: `[${context.componentType}] Error en ejecución del método ${context.propertyKey} en ${context.className}: ${error?.message}`,
    processingTime: processingTimeMsError,
  });

  context.logger.error(
    `[${errorLogEntry.level}] ${errorLogEntry.message}`,
    errorLogEntry,
  );
}
