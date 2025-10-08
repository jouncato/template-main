import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Esquemas comunes para la documentación de OpenAPI
 */

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP del error',
    example: 400,
    type: 'integer',
  })
  statusCode: number = 0;

  @ApiProperty({
    description: 'Mensaje descriptivo del error',
    example: 'Bad Request',
    type: 'string',
  })
  message: string = '';

  @ApiProperty({
    description: 'Tipo de error',
    example: 'ValidationError',
    type: 'string',
  })
  error: string = '';

  @ApiProperty({
    description: 'Timestamp del error',
    example: '2025-07-21T17:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  timestamp: string = '';

  @ApiProperty({
    description: 'Ruta donde ocurrió el error',
    example: '/MS/RES/RSAudEntiTrxLogSLCPub/V1/bills/registerLogTrx',
    type: 'string',
  })
  path: string = '';
}

export class KafkaResponseDto {
  @ApiProperty({
    description: 'Nombre del topic de Kafka donde se envió el mensaje',
    example: 'BillLogTransCreditTopic',
    type: 'string',
  })
  topicName: string = '';

  @ApiProperty({
    description: 'Partición de Kafka donde se almacenó el mensaje',
    example: 0,
    type: 'integer',
    minimum: 0,
  })
  partition: number = 0;

  @ApiProperty({
    description: 'Offset del mensaje en la partición',
    example: '12345',
    type: 'string',
  })
  offset: string = '';

  @ApiProperty({
    description: 'Timestamp de cuando se produjo el mensaje',
    example: '2025-07-21T17:30:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  timestamp?: string;

  constructor() {
    this.timestamp = undefined;
  }
}

export class HealthCheckDto {
  @ApiProperty({
    description: 'Estado general del servicio',
    example: 'ok',
    enum: ['ok', 'error', 'shutting_down'],
    type: 'string',
  })
  status: string = '';

  @ApiProperty({
    description: 'Información detallada del estado de cada componente',
    type: 'object',
    properties: {
      kafka: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['up', 'down'],
            example: 'up',
          },
          message: {
            type: 'string',
            example: 'Kafka connection is healthy',
          },
        },
      },
      database: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['up', 'down'],
            example: 'up',
          },
          message: {
            type: 'string',
            example: 'Database connection is healthy',
          },
        },
      },
    },
  })
  info: Record<string, any> = {};

  @ApiPropertyOptional({
    description: 'Detalles adicionales del estado',
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, any>;

  @ApiProperty({
    description: 'Código de error si el servicio no está saludable',
    type: 'string',
    required: false,
  })
  error?: string;

  constructor() {
    this.details = undefined;
    this.error = undefined;
  }
}
