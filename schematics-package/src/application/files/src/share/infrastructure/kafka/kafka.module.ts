import { Module } from '@nestjs/common';

import { AppService } from '../../../app/application/app.service';
import { IAppService } from '../../../app/domain/interfaces/IAppService';

import { ApmService } from '../../domain/config/apm/apm.service';

import { KafkaConsumerService } from './kafkaConsumer.service';

/**
 *  @description clase anotada con un decorador @Module(). El decorador @Module() proporciona
 *  metadatos que Nest utiliza para organizar la estructura de la aplicación.
 *
 *  @author Santiago Vargas Acevedo
 *  @date abril-024 del 2022
 *
 */
@Module({
  providers: [
    KafkaConsumerService,
    ApmService,
    {
      provide: IAppService,
      useClass: AppService,
    },
  ],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}
