import { Injectable, Logger } from '@nestjs/common';

import apm from 'elastic-apm-node';

@Injectable()
export class ApmService {
  private readonly logger = new Logger(ApmService.name);

  constructor() {
    if (apm.isStarted()) {
      this.logger.log('APM Agent already initialized and active');
    } else {
      this.logger.warn('APM Agent is not started');
    }
  }

  /**
   *  @description Metodo para validar si apm esta iniciado.
   */
  isStarted() {
    return apm.isStarted();
  }

  /**
   *  @description Metodo implementado para capturar los errores que se puedan generar
   *  incluyendo errores HTTP 4xx y 5xx con contexto adicional.
   */
  captureError(err: Error | string | apm.ParameterizedMessageObject) {
    apm.captureError(err);
  }

  /**
   *  @description Metodo implementado para que al momento de  iniciar nuestro micro servicio
   *  comience a interceptar (capturar) las transacciones realizadas por un cliente.
   */
  startTransaction(name: string): apm.Transaction {
    return apm.startTransaction(name);
  }

  /**
   *  @description Metodo para establecer el nombre de nuestras transacciones
   *  al momento de  iniciar nuestro micro servicio.
   */
  setTransactionName(name: string) {
    return apm.setTransactionName(name);
  }

  /**
   *  @description Metodo para finalizar la transaccion que se encuentre activa.
   */
  endTransaction(): void {
    apm.endTransaction();
  }

  /**
   *  @description Metodo para iniciar un span personalizado
   */
  startSpan(
    name: string,
    type: string,
    subtype: string,
    action: string,
  ): apm.Span | null {
    return apm.startSpan(name, type, subtype, action);
  }

  /**
   *  @description Sanitiza nombres de etiquetas para APM
   *  Reemplaza caracteres problemáticos para evitar warnings
   */
  sanitizeLabelKey(key: string): string {
    return key
      .replace(/\./g, '_') // Reemplazar puntos con guiones bajos
      .replace(/[^a-zA-Z0-9_]/g, '_') // Reemplazar otros caracteres especiales
      .toLowerCase(); // Convertir a minúsculas
  }

  /**
   *  @description Establece una etiqueta sanitizada en la transacción actual
   */
  setLabel(key: string, value: apm.LabelValue): void {
    const transaction = apm.currentTransaction;
    if (transaction) {
      const sanitizedKey = this.sanitizeLabelKey(key);
      transaction.setLabel(sanitizedKey, value);
    }
  }

  /**
   *  @description Establece un contexto personalizado en la transacción actual
   */
  setCustomContext(context: object): void {
    apm.setCustomContext(context);
  }
}
