import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthService } from '../application/health.service';

/**
 * Controlador para los servicios de salud del módulo de validación de contratos
 */
@ApiTags('Health Check')
@Controller('rest/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificar estado de salud del servicio',
    description:
      'Endpoint para verificar el estado de salud del servicio de validación de contratos y sus dependencias (base de datos)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Estado de salud del servicio - Todas las dependencias funcionando correctamente',
    example: {
      status: 'ok',
      info: {
        database: {
          status: 'up',
          isConnected: true,
          message: 'Database is connected and responsive',
          server: 'db-server.example.com',
          database: 'ContractsDB',
        },
      },
      error: {},
      details: {
        database: {
          status: 'up',
          isConnected: true,
          message: 'Database is connected and responsive',
          server: 'db-server.example.com',
          database: 'ContractsDB',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description:
      'Servicio no disponible - Una o más dependencias presentan problemas',
    example: {
      status: 'error',
      info: {},
      error: {
        database: {
          status: 'down',
          isConnected: false,
          message: 'Database health check failed: Connection timeout',
          error: 'Connection timeout',
        },
      },
      details: {
        database: {
          status: 'down',
          isConnected: false,
          message: 'Database health check failed: Connection timeout',
          error: 'Connection timeout',
        },
      },
    },
  })
  checkHealth() {
    return this.healthService.check();
  }
}
