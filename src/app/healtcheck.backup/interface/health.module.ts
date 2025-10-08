import { Module } from '@nestjs/common';

import { GlobalModule } from '@share/domain/config/global.module';

import { HealthService } from '../application/health.service';

import { HealthController } from './health.controller';

/**
 * Módulo para la configuración de los servicios de salud del publicador
 */
@Module({
  imports: [
    GlobalModule,
    // SqlModule,
    // OracleModule
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
