import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AppService } from '@src/app/application/app.service';
import { AppRequest } from '@src/app/domain/dto/appRequest.dto';
import { LogExecutionAndCatch } from '@share/domain/config/decorators/logExecutionAndCatch.decorator';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import { ApiResponseDto } from '@share/domain/dto/apiResponse.dto';

import { TRANSACTION_CONTROLLER_PATH } from './dynamic-controller-paths';

/**
 *  @description Archivo controlador responsable de manejar las solicitudes entrantes que llegan a un end point.
 *  En este caso seran posible acceder por medio de metodos http
 *
 *  @author Celula Azure
 *
 */
@ApiTags('Transaction Log')
@Controller(TRANSACTION_CONTROLLER_PATH)
export class AppController {
  constructor(
    private readonly service: AppService,
    private readonly configService: ConfigService,
    private readonly logger: Logger20Service,
  ) {
    // Log la configuración actual de la ruta para debugging
    const configuredPath = this.configService.get<string>('CONTROLLER_PATH');
    this.logger.log(`Controller path configured: ${configuredPath}`);
  }

  @ApiOperation({
    summary: 'Consultar log de transacción',
    description:
      'Endpoint para consultar el log de transacciones de saldo en línea. Este servicio recibe la información de la transacción y la envía a Kafka para su procesamiento.',
    operationId: 'getTransactionLog',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  @ApiResponse({
    status: 200,
    description: 'Transacción consultada exitosamente',
    type: ApiResponseDto,
    content: {
      'application/json': {
        example: {
          responseCode: 200,
          message: 'OK',
          data: {
            topicName: 'BillLogTransCreditTopic',
            partition: 0,
            offset: '12345',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    content: {
      'application/json': {
        example: {
          responseCode: '400',
          messageCode: 'ERROR_REQUEST',
          message: 'Error en la validación de datos en el request',
          legacy: 'ARO OPENSHIFT',
          transactionId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2025-07-21T17:30:00.000Z',
          result: {
            code: 400,
            message:
              'Inconsistencia en los datos de entrada. Los datos proporcionados no son válidos. Se han encontrado los siguientes errores:',
            error: [
              'El campo "id_tipo_documento_int" no puede estar vacío',
              'El campo "id_tipo_documento_int" debe ser un número entero',
              'El campo "numero_documento_num" no puede estar vacío',
              'El campo "numero_documento_num" debe ser un número',
            ],
            timestamp: '2025-07-21T17:30:00.000Z',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado para acceder al recurso',
    content: {
      'application/json': {
        example: {
          responseCode: '401',
          messageCode: 'ERROR_NO_AUTORIZADO',
          message: 'No autorizado para acceder al recurso',
          legacy: 'ARO OPENSHIFT',
          transactionId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2025-07-21T17:30:00.000Z',
          result: {
            code: 401,
            message: 'Acceso denegado',
            timestamp: '2025-07-21T17:30:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
    content: {
      'application/json': {
        example: {
          responseCode: '404',
          messageCode: 'ERROR_RECURSO_NO_ENCONTRADO',
          message: 'Solicitud a un recurso no encontrado',
          legacy: 'ARO OPENSHIFT',
          transactionId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2025-07-21T17:30:00.000Z',
          result: {
            code: 404,
            message: 'Información no disponible',
            timestamp: '2025-07-21T17:30:00.000Z',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor',
    content: {
      'application/json': {
        example: {
          responseCode: '500',
          messageCode: 'ERROR_INTERNO_DEL_SERVIDOR',
          message: 'Error interno del servidor',
          legacy: 'ARO OPENSHIFT',
          transactionId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2025-07-21T17:30:00.000Z',
          data: {},
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Servicio no disponible (problemas con Kafka)',
    content: {
      'application/json': {
        example: {
          responseCode: '503',
          messageCode: 'ERROR_SERVICIO_NO_DISPONIBLE',
          message: 'Servicio no disponible',
          legacy: 'ARO OPENSHIFT',
          transactionId: '550e8400-e29b-41d4-a716-446655440000',
          timestamp: '2025-07-21T17:30:00.000Z',
          data: {},
        },
      },
    },
  })
  @Get('')
  @LogExecutionAndCatch()
  transactionConsultResult(
    @Query() payload: AppRequest,
  ): Promise<ApiResponseDto> {
    return this.service.transactionService(payload);
  }
}
