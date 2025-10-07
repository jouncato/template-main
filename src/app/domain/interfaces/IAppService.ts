import { ApiResponseDto } from '@src/share/domain/dto/apiResponse.dto';

import { AppRequest } from '../dto/appRequest.dto';

/**
 * @description Interfaz abstracta que define el contrato para el servicio de transacciones.
 * Aplica el principio de inversión de dependencias separando la abstracción de la implementación.
 *
 * @author Celula Azure
 */
export abstract class IAppService {
  /**
   * Procesa una solicitud de transacción
   * @param generalRequest - La solicitud de transacción a procesar
   * @returns Promise con la respuesta de la API
   */
  abstract transactionService(
    generalRequest: AppRequest,
  ): Promise<ApiResponseDto>;
}
