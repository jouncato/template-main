import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

import { als } from '../config/txid/als';

/**
 *  @description Clase de respuesta estándar para todas las operaciones de la API.
 *  Proporciona un formato consistente para las respuestas HTTP.
 *
 *  @author Celula Azure
 *
 */
export interface ApiResponseDtoParams<T = any> {
  responseCode: HttpStatus;
  messageCode?: string;
  message: string;
  result?: T;
  transactionId?: string;
  legacy?: string;
}

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Código de respuesta HTTP',
    example: 200,
    type: 'integer',
    minimum: 100,
    maximum: 599,
    examples: {
      success: {
        summary: 'Éxito',
        value: 200,
      },
      badRequest: {
        summary: 'Solicitud incorrecta',
        value: 400,
      },
      unauthorized: {
        summary: 'No autorizado',
        value: 401,
      },
      serverError: {
        summary: 'Error del servidor',
        value: 500,
      },
      serviceUnavailable: {
        summary: 'Servicio no disponible',
        value: 503,
      },
    },
  })
  responseCode: number;

  @ApiProperty({
    description:
      'Código interno de mensaje para identificar el tipo de respuesta',
    example: 'SUCCESS_001',
    required: false,
    type: String,
    maxLength: 100,
  })
  messageCode?: string;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado de la operación',
    example: 'OK',
    type: 'string',
    maxLength: 500,
    examples: {
      success: {
        summary: 'Operación exitosa',
        value: 'OK',
      },
      error: {
        summary: 'Error de validación',
        value: 'El campo "action" no puede estar vacío',
      },
      serviceError: {
        summary: 'Error de servicio',
        value:
          'Se está presentando un error de conexión, por favor intenta de nuevo',
      },
    },
  })
  message: string;

  @ApiProperty({
    description: 'Origen de la respuesta o sistema legacy',
    example: 'OpenShift',
    required: false,
    type: String,
  })
  legacy?: string;

  @ApiProperty({
    description: 'Identificador único de la transacción',
    example: 'b7e6c8a2-1f2d-4e3a-9c1b-2a4e5f6d7c8b',
    required: false,
    type: 'string',
  })
  @ApiProperty({
    description: 'Identificador único de la transacción',
    example: 'b7e6c8a2-1f2d-4e3a-9c1b-2a4e5f6d7c8b',
    required: false,
    type: String,
  })
  transactionId?: string;

  @ApiProperty({
    description: 'Fecha y hora en que se generó la respuesta',
    example: '2025-09-01T12:34:56.789Z',
    required: false,
    type: 'string',
    format: 'date-time',
  })
  @ApiProperty({
    description: 'Fecha y hora en que se generó la respuesta',
    example: '2025-09-01T12:34:56.789Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Resultado de la operación, puede ser cualquier tipo de dato',
    required: false,
    nullable: true,
    type: Object,
    example: { id: 1, name: 'John Doe' },
  })
  result?: T;

  constructor(params: ApiResponseDtoParams<T>) {
    this.responseCode = params.responseCode;
    this.messageCode = params.messageCode;
    this.message = params.message;
    this.transactionId = params.transactionId ?? als.getStore()?.txId;
    this.legacy = params.legacy ?? 'OpenShift';
    this.timestamp = new Date().toISOString();
    this.result = params.result;
  }
}
