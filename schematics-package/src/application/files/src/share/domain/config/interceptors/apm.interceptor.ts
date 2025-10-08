import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApmService } from '../apm/apm.service';
import { als } from '../txid/als';

/**
 *  @description Clase que intercepta las peticiones Http con el fin de enviar detalle de los errores a APM
 *
 */
@Injectable()
export class ApmInterceptor implements NestInterceptor {
  constructor(private readonly apmService: ApmService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req: FastifyRequest = ctx.switchToHttp().getRequest();

    this.apmService.setLabel(
      'transaction.id',
      als.getStore()?.txId || 'transaction_id',
    );
    this.apmService.setLabel('component', ctx.getHandler().name);
    this.apmService.setLabel('class', ctx.getClass().name);
    this.apmService.setLabel('method', req.method);

    return next.handle().pipe(
      catchError((error) => {
        this.apmService.captureError(error as Error);
        throw error;
      }),
    );
  }
}
