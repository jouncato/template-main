import { Global, Module, Scope } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import {
  CustomExceptionFilter,
  InternalServerErrorExceptionFilter,
  NotFoundExceptionFilter,
  ServiceUnavailableExceptionFilter,
} from '../../../share/interfaces/filter/customExceptionFilter';

import { ApmService } from './apm/apm.service';
import { ApmInterceptor } from './interceptors/apm.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { TimeOutInterceptor } from './interceptors/timeout.interceptors';
import { Logger20Service } from './logger/logger20.service';

/**
 *  @description Modulo de la estructura 'global'
 *
 *  @author Fabrica Digital
 *
 */
@Global()
@Module({
  providers: [
    ApmService,
    Logger20Service,
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.DEFAULT,
      useClass: ApmInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.DEFAULT,
      useClass: TimeOutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      scope: Scope.DEFAULT,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: InternalServerErrorExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ServiceUnavailableExceptionFilter,
    },
  ],
  exports: [ApmService, Logger20Service],
})
export class GlobalModule {}
