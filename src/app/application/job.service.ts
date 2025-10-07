import { Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import apm from 'elastic-apm-node';

import { ApmService } from '@src/share/domain/config/apm/apm.service';
import { LogExecutionAndCatch } from '@src/share/domain/config/decorators/logExecutionAndCatch.decorator';
import { HttpService } from '@src/share/infrastructure/http/http.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import { LogLevel } from '@share/domain/config/logger/types/logger20.type';
import { runWithTx } from '@share/domain/config/txid/als';
import { generateTxId } from '@share/domain/config/txid/txid.utils';
import config from '@share/domain/resources/env.config';

const env: ConfigType<typeof config> = {
  ...config(),
  ...process.env,
};

@Injectable()
export class JobService {
  constructor(
    private readonly logger: Logger20Service,
    private readonly apmService: ApmService,
    private readonly httpService: HttpService,
  ) {}

  @Cron(env.CRON_EXPRESSION ?? '* * * * *', {
    name: 'executeCron',
    timeZone: 'America/Bogota',
  })
  async executeCron(): Promise<void> {
    const txId = generateTxId();
    let transaction: apm.Transaction | undefined;

    await runWithTx(async () => {
      if (this.apmService.isStarted()) {
        transaction = this.apmService.startTransaction(`Cron Job`);
      }

      const processLogger = this.logger.startProcess('Cron Job', {
        methodName: 'executeCron',
        request: {},
      });

      try {
        await this.performTask();

        processLogger.endProcess('Cron Job completado exitosamente', {
          response: {},
        });
      } catch (error: unknown) {
        this.apmService.captureError(error as Error);

        processLogger.endProcess(
          'Error en Cron Job',
          {
            message: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
          LogLevel.ERROR,
        );
      } finally {
        if (transaction) {
          transaction.end();
        }
      }
    }, txId);
  }

  @LogExecutionAndCatch()
  private async performTask(): Promise<void> {
    this.logger.debug?.('Ejecutando tarea personalizada...');
  }
}
