import {
  CallHandler,
  ExecutionContext,
  GatewayTimeoutException,
  HttpStatus,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { ApiResponseDto } from '../../dto/apiResponse.dto';
import config from '../../resources/env.config';
import { Logger20Service } from '../logger/logger20.service';
import { als } from '../txid/als';
import { ALT_HEADER, TX_HEADER } from '../txid/txid.utils';

/**
 *  @description Metodo que intercepta todas la peticiones y
 *  que permite ejecutar el circuit break segun la configuracion
 *  del timeout.
 *
 *  @author Fabrica Digital de Microservicios
 *  @date Febrero de 2022
 *
 */
@Injectable()
export class TimeOutInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: Logger20Service,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      timeout(this.configService.TIMEOUT),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          const http = context.switchToHttp();
          const req = http.getRequest<FastifyRequest>();
          const res: FastifyReply = http.getResponse();

          const fromAls = als.getStore()?.txId;
          const fromHdr =
            (req?.headers?.[TX_HEADER] as string) ||
            (req?.headers?.[ALT_HEADER] as string);
          const txId = fromHdr || fromAls || uuidv4();

          if (typeof res.header === 'function') res.header(TX_HEADER, txId);

          this.logger.error(
            'La operación alcanzó el tiempo máximo de espera',
            {
              message: 'La operación alcanzó el tiempo máximo de espera',
              response: req?.url,
              methodName: req?.method,
              transactionId: txId,
            },
            TimeOutInterceptor.name,
          );

          return throwError(
            () =>
              new GatewayTimeoutException(
                new ApiResponseDto({
                  responseCode: HttpStatus.GATEWAY_TIMEOUT,
                  messageCode: 'GATEWAY_TIMEOUT',
                  message: 'La operación alcanzó el tiempo máximo de espera',
                  transactionId: txId,
                  result: {},
                }),
              ),
          );
        }
        return throwError(() => err as Error);
      }),
    );
  }
}
