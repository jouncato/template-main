import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { OracleService } from '@src/share/infrastructure/oracle/oracle.service';

import envConfig from '../../../share/domain/resources/env.config';

/**
 *  @description Service for executing stored procedures.
 *
 *  @author Celula Azure
 */
@Injectable()
export class DatabaseService {
  constructor(
    @Inject(envConfig.KEY)
    private readonly envConfigService: ConfigType<typeof envConfig>,
    private readonly oracleService: OracleService,
    // private readonly sqlServerService: SqlServerService,
  ) {}

  public async executePrc() {}

  // public async consultClientPrc(
  //   inputParams: PrcConsultClientInput,
  // ): Promise<ClientRecord[]> {
  //   const result = (await this.sqlServerService.executeProcedure(
  //     this.envConfigService.PROCEDURES.PRC_CONSULT_CLIENT,
  //     inputParams.toSqlParams(),
  //   )) as unknown as PrcConsultClientResult;

  //   const { recordset } = result;

  //   if (recordset?.[0]?.iCodeErrorId !== 0 || recordset?.length === 0) {
  //     return null;
  //   }
  //   return recordset;
  // }
}
