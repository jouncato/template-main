import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import * as oracledb from 'oracledb';

import { ApmService } from '@share/domain/config/apm/apm.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';

import config from '../../domain/resources/env.config';

import { OracleService } from './oracle.service';

/**
 *  @description clase anotada con un decorador @Module(). El decorador @Module() proporciona 
 *  metadatos que Nest utiliza para organizar la estructura de la aplicación.

 *
 *  @author Celula Azure
 *
 */
@Module({
  providers: [
    {
      provide: OracleService,
      useFactory: async (
        Logger20Service: Logger20Service,
        configService: ConfigType<typeof config>,
        apmService: ApmService,
      ) => {
        const service = new OracleService(
          Logger20Service,
          configService,
          apmService,
        );
        await service.onModuleInit();
        return service;
      },
      inject: [Logger20Service, config.KEY, ApmService],
    },
  ],
  exports: [OracleService],
})
export class OracleModule {
  async onModuleDestroy() {
    await oracledb.getPool().close(10);
  }
}
