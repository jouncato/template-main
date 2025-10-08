import { HttpStatus } from '@nestjs/common';
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import { ApmService } from '@src/share/domain/config/apm/apm.service';
import {
  ALT_HEADER,
  TX_HEADER,
} from '@src/share/domain/config/txid/txid.utils';

import { Logger20Service } from '../../domain/config/logger/logger20.service';
import { als } from '../../domain/config/txid/als';
import { ApiResponseDto } from '../../domain/dto/apiResponse.dto';

interface ValidationErrorsResult {
  errors: string[];
  fields: string[];
}

export function getTxIdFromContext(
  req: FastifyRequest,
  reply?: FastifyReply,
): string {
  const fromAls = als.getStore()?.txId;
  const fromHeader =
    (req?.headers?.[TX_HEADER] as string) ||
    (req?.headers?.[ALT_HEADER] as string);
  const fromReq =
    (req?.body?.['transactionId'] as string) ||
    (req?.query?.['transactionId'] as string) ||
    (req?.params?.['transactionId'] as string);

  const txId = fromHeader || fromAls || fromReq || uuidv4();

  if (reply != null && typeof reply.header === 'function') {
    reply.header(TX_HEADER, txId);
  }
  return txId;
}

@Catch(BadRequestException)
export class CustomExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(Logger20Service) private readonly logger: Logger20Service,
  ) {}

  private extractValidationErrors(errorResponse: {
    errors?: Array<{
      property?: string;
      constraints?: Record<string, string>;
    }>;
    message?: string | string[];
    [key: string]: any;
  }): ValidationErrorsResult {
    let allErrors: string[] = [];
    const affectedFields: string[] = [];

    if (errorResponse.errors && Array.isArray(errorResponse.errors)) {
      errorResponse.errors.forEach((error) => {
        if (error.property) {
          affectedFields.push(error.property);
        }
        if (error.constraints) {
          allErrors.push(...Object.values(error.constraints).map(String));
        } else {
          allErrors.push(`Error en el campo ${error.property}`);
        }
      });
    } else if (Array.isArray(errorResponse.message)) {
      allErrors = errorResponse.message;
    } else if (typeof errorResponse.message === 'string') {
      allErrors = [errorResponse.message];
    }

    return { errors: allErrors, fields: affectedFields };
  }

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();
    const request: FastifyRequest = ctx.getRequest();

    const { errors: allErrors, fields: affectedFields } =
      this.extractValidationErrors(errorResponse as object);

    const requestData = {
      body: request?.['body'] || {},
      query: request?.['query'] || {},
      params: request?.['params'] || {},
    };

    if (allErrors.length === 0) {
      allErrors.push(exception.message || 'Error de validación');
    }

    const transactionId = getTxIdFromContext(request, response);

    this.logger.error(`Error en la solicitud`, {
      response: allErrors,
      request: requestData,
      methodName: 'CustomExceptionFilter',
    });

    response.code(status).send(
      new ApiResponseDto({
        responseCode: HttpStatus.BAD_REQUEST,
        messageCode: 'ERROR_REQUEST',
        message: 'Error en la validación de datos en el request',
        result: {
          code: HttpStatus.BAD_REQUEST,
          message: `Inconsistencia en los datos de entrada. Los datos proporcionados no son válidos. Se han encontrado los siguientes errores:`,
          error: allErrors,
          affectedFields,
          timestamp: new Date().toISOString(),
          requestData: requestData,
        },
        transactionId,
      }),
    );
  }
}

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  constructor(private readonly apmService: ApmService) {}

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req: FastifyRequest = ctx.getRequest();
    const transactionId = getTxIdFromContext(req, res);

    if (this.apmService.isStarted()) {
      const method = req.method || 'UNKNOWN';
      const url = req.url || '/unknown-route';

      this.apmService.setTransactionName(`${method} ${url}`);
      this.apmService.setLabel('http.method', method);
      this.apmService.setLabel('http.url', url);
      this.apmService.setLabel('http.status_code', '404');
      this.apmService.captureError(exception);
    }

    res.code(HttpStatus.NOT_FOUND).send(
      new ApiResponseDto({
        responseCode: HttpStatus.NOT_FOUND,
        messageCode: 'ERROR_RECURSO_NO_ENCONTRADO',
        message: 'Solicitud a un recurso no encontrado',
        result: {
          code: HttpStatus.NOT_FOUND,
          message: 'Información no disponible',
          timestamp: new Date().toISOString(),
        },
        transactionId,
      }),
    );
  }
}

@Catch(InternalServerErrorException)
export class InternalServerErrorExceptionFilter implements ExceptionFilter {
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req: FastifyRequest = ctx.getRequest();
    const transactionId = getTxIdFromContext(req, res);

    res.code(HttpStatus.INTERNAL_SERVER_ERROR).send(
      new ApiResponseDto({
        responseCode: HttpStatus.INTERNAL_SERVER_ERROR,
        messageCode: 'ERROR_INTERNO_DEL_SERVIDOR',
        message: 'Error interno del servidor',
        result: {},
        transactionId,
      }),
    );
  }
}

@Catch(ServiceUnavailableException)
export class ServiceUnavailableExceptionFilter implements ExceptionFilter {
  catch(exception: ServiceUnavailableException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req: FastifyRequest = ctx.getRequest();
    const transactionId = getTxIdFromContext(req, res);

    res.code(HttpStatus.SERVICE_UNAVAILABLE).send(
      new ApiResponseDto({
        responseCode: HttpStatus.SERVICE_UNAVAILABLE,
        messageCode: 'ERROR_SERVICIO_NO_DISPONIBLE',
        message: 'Servicio no disponible',
        result: {},
        transactionId,
      }),
    );
  }
}
