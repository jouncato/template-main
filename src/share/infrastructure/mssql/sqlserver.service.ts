import { Inject, Injectable } from '@nestjs/common';

import * as sql from 'mssql';

import { LogExecutionAndCatch } from '@share/domain/config/decorators/logExecutionAndCatch.decorator';

import { Logger20Service } from '../../../share/domain/config/logger/logger20.service';

@Injectable()
export class SqlServerService {
  constructor(
    @Inject('SQL_CONNECTION')
    private readonly pool: sql.ConnectionPool,
    private readonly logger: Logger20Service,
  ) {}

  @LogExecutionAndCatch()
  async executeProcedure<T>(
    procedureName: string,
    inputParams: Record<string, { type: sql.ISqlType; value: any }> = {},
    outputParams: Record<string, sql.ISqlType> = {},
  ): Promise<sql.IProcedureResult<T>> {
    const request = this.pool.request();

    this.addInputParameters(request, inputParams);

    this.addOutputParameters(request, outputParams);

    const result = await request.execute<T>(procedureName);

    return result;
  }

  private addInputParameters(
    request: sql.Request,
    inputParams: Record<string, { type: sql.ISqlType; value: any }>,
  ): void {
    for (const [key, param] of Object.entries(inputParams)) {
      if (param.value === undefined || param.value === null) {
        continue;
      }
      request.input(key, param.type, param.value);
    }
  }

  private addOutputParameters(
    request: sql.Request,
    outputParams: Record<string, sql.ISqlType>,
  ): void {
    for (const [key, type] of Object.entries(outputParams)) {
      request.output(key, type);
    }
  }
}
