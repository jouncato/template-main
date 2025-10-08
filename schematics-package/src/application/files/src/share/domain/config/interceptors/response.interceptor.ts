import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { FastifyReply } from 'fastify';
import { map, Observable } from 'rxjs';

import { ApiResponseDto } from '@share/domain/dto/apiResponse.dto';

/**
 * @description Interceptor para manejar respuestas de forma uniforme
 * Permite configurar códigos de respuesta dinámicamente sin usar @Res
 *
 * @author Celula Azure
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: ApiResponseDto) => {
        const response: FastifyReply = context.switchToHttp().getResponse();

        if (data instanceof ApiResponseDto && data.responseCode) {
          response.status(data.responseCode);
        }

        return data;
      }),
    );
  }
}
