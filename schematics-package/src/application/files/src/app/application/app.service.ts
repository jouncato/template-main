import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { AppRequest } from '@src/app/domain/dto/appRequest.dto';
import { IAppService } from '@src/app/domain/interfaces/IAppService';
import { LogExecutionAndCatch } from '@share/domain/config/decorators/logExecutionAndCatch.decorator';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import { ApiResponseDto } from '@share/domain/dto/apiResponse.dto';
import config from '@share/domain/resources/env.config';

/**
 *  @description Clase servicio responsable recibir el parametro y realizar la logica de negocio.
 *
 *  @author Celula Azure
 *
 */
@Injectable()
export class AppService extends IAppService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    private readonly logger: Logger20Service,
    // private readonly databaseService: DatabaseService,
  ) {
    super();
  }

  @LogExecutionAndCatch()
  public async transactionService(
    _generalRequest: AppRequest,
  ): Promise<ApiResponseDto> {
    try {
      //const result = await this.databaseService.executePrc();

      return new ApiResponseDto({
        responseCode: HttpStatus.OK,
        messageCode: 'OK',
        message: 'Proceso ejecutado con éxito',
        result: { data: 'Resultado de la operación' },
      });
    } catch (error: unknown) {
      return this.handleError(error as Error);
    }
  }

  /**
   * Maneja errores y devuelve la respuesta apropiada
   * @param error - Error capturado
   * @returns Respuesta de error o lanza excepción
   */
  private handleError(error: Error): ApiResponseDto {
    this.logger.error('Error en interno del servidor', {
      response: error.message,
      message: error.stack,
    });

    return new ApiResponseDto({
      responseCode: HttpStatus.SERVICE_UNAVAILABLE,
      messageCode: 'SERVICE_UNAVAILABLE',
      message: 'No se pudo procesar la solicitud',
    });
  }
}
