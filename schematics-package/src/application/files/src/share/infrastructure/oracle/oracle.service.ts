import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import * as oracledb from 'oracledb';

import { ApmService } from '@share/domain/config/apm/apm.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import { LogLevel } from '@share/domain/config/logger/types/logger20.type';
import { IOracleService } from '@share/domain/interfaces/IOracleService';

import config from '../../domain/resources/env.config';

@Injectable()
export class OracleService
  extends IOracleService
  implements OnModuleInit, OnModuleDestroy
{
  private poolInitialized = false;
  private poolAlias: string;

  constructor(
    private readonly logger: Logger20Service,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    private readonly apmService: ApmService,
  ) {
    super();

    this.poolAlias =
      this.configService?.POOL?.DB_POOL_ALIAS ??
      this.configService.SERVICE_NAME.toLowerCase();
  }

  async onModuleInit() {
    if (this.poolInitialized) {
      return;
    }
    try {
      await oracledb.createPool({
        poolAlias: this.poolAlias,
        user: this.configService.CONNECTION_ORACLE.DB_USERNAME,
        password: this.configService.CONNECTION_ORACLE.DB_PASSWORD,
        connectString: this.configService.CONNECTION_ORACLE.DB_CONNECTSTRING,
        poolMin: this.configService.POOL.DB_POOL_MIN,
        poolMax: this.configService.POOL.DB_POOL_MAX,
        poolIncrement: this.configService.POOL.DB_POOL_INCREMENT,
        poolTimeout: this.configService.POOL.DB_POOL_TIMEOUT,
        queueTimeout: this.configService.POOL.DB_QUEUE_TIMEOUT,
        stmtCacheSize: this.configService.POOL.DB_STMT_CACHE_SIZE,
        enableStatistics: true,
      });

      await this.validateConnection();

      this.logger.log(
        'Pool de conexiones creado y validado para la base de datos principal',
      );
      this.poolInitialized = true;

      await this.registerPoolStatistics();
    } catch (error: unknown) {
      this.logger.error(
        'Error detallado al crear y validar el pool de conexiones:',
        {
          message: (error as Error).message,
          response: (error as Error).stack,
          request: {
            hasDatabase: !!this.configService.CONNECTION_ORACLE,
            username: this.configService.CONNECTION_ORACLE?.DB_USERNAME,
            connectString:
              this.configService.CONNECTION_ORACLE?.DB_CONNECTSTRING,
          },
        },
      );

      if (
        (error as Error).message.includes('ORA-01017') ||
        (error as Error).message.includes('invalid username/password')
      ) {
        throw new Error(
          'Error de autenticación: Usuario o contraseña incorrectos para Oracle',
        );
      } else if (
        (error as Error).message.includes('ORA-12541') ||
        (error as Error).message.includes('listener')
      ) {
        throw new Error(
          'Error de conectividad: No se puede conectar al servidor Oracle',
        );
      } else if (
        (error as Error).message.includes('ORA-12154') ||
        (error as Error).message.includes('could not resolve')
      ) {
        throw new Error(
          'Error de configuración: String de conexión Oracle inválido',
        );
      } else {
        throw new Error(
          `Error al inicializar la conexión Oracle: ${(error as Error).message}`,
        );
      }
    }
  }

  private async validateConnection(): Promise<void> {
    let connection: oracledb.Connection | undefined;
    try {
      this.logger.log('Validando conexión a la base de datos Oracle...');
      connection = await this.getConnection(this.poolAlias);

      const result = await connection.execute('SELECT 1 FROM DUAL');

      if (!result?.rows || result.rows.length === 0) {
        throw new Error(
          'La consulta de validación no retornó resultados esperados',
        );
      }

      this.logger.log('Conexión a Oracle validada exitosamente');
    } catch (error: unknown) {
      this.logger.error('Error al validar la conexión a Oracle:', {
        message: (error as Error).message,
        response: (error as Error).stack,
      });

      try {
        await oracledb.getPool(this.poolAlias).close(0);
      } catch (closeError: unknown) {
        this.logger.error(
          'Error al cerrar el pool después de validación fallida:',
          closeError as Error,
        );
      }

      throw new Error(
        `Fallo en la validación de conexión a Oracle: ${(error as Error).message}`,
      );
    } finally {
      if (connection) await this.closeConnection(connection);
    }
  }

  async onModuleDestroy() {
    try {
      await oracledb.getPool(this.poolAlias).close(10);
      this.logger.log(
        'Pool de conexiones cerrado para la base de datos principal',
      );
    } catch (err: unknown) {
      this.logger.error(
        'Error al cerrar los pools de conexiones',
        err as Error,
      );
    }
  }

  public async getConnection(poolAlias: string): Promise<oracledb.Connection> {
    try {
      return await oracledb.getConnection(poolAlias);
    } catch (err: unknown) {
      this.logger.error(
        `Error al obtener la conexión del pool por ${this.poolAlias}`,
        err as Error,
      );
      throw err;
    }
  }

  private async registerPoolStatistics() {
    try {
      const pool = oracledb.getPool(`${this.poolAlias}`);

      const poolStats = pool.getStatistics();

      this.apmService.setCustomContext({
        poolStats,
      });
    } catch (error: unknown) {
      this.logger.error(
        'Error al registrar las estadísticas del pool en APM',
        error as Error,
      );
    }
  }

  public async closeConnection(connection: oracledb.Connection): Promise<void> {
    try {
      await connection?.close();
    } catch (err: unknown) {
      this.logger.error('Error al cerrar la conexión', err as Error);
      throw err;
    }
  }

  public async callProcedure<T, C = unknown>(
    prcName: string,
    binds: oracledb.BindParameters,
    options: oracledb.ExecuteOptions = {},
  ): Promise<oracledb.Result<T>> {
    const span = this.apmService.startSpan(
      prcName,
      'db',
      'oracle',
      'procedure',
    );
    const sql = `BEGIN ${prcName}(${Object.keys(binds)
      .map((k) => `:${k}`)
      .join(',')}); END;`;

    const execOpts: oracledb.ExecuteOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    };

    const conn = await this.getConnection(this.poolAlias);

    const processLogger = this.logger.startProcess(
      `Consumo Procedimiento ${prcName}`,
      {
        request: binds,
      },
    );

    try {
      const res = await conn.execute<T>(sql, binds, execOpts);

      const [cursorKey] =
        Object.entries(binds).find(
          ([, bind]: [string, unknown]) =>
            (bind as { type?: unknown })?.type === oracledb.CURSOR,
        ) || [];

      if (cursorKey && res.outBinds && res.outBinds?.[cursorKey]) {
        res.outBinds[cursorKey] = await this.fetchAllFromCursor<C>(
          res.outBinds[cursorKey] as oracledb.ResultSet<C>,
        );
      }

      processLogger.endProcess(
        `Ejecución de procedimiento almacenado ${prcName} exitoso`,
        {
          response: res,
          methodName: 'callProcedure',
        },
      );

      this.apmService.setCustomContext({
        database: { operation: prcName, pool: this.poolAlias },
      });

      return res;
    } catch (e: unknown) {
      processLogger.endProcess(
        `Error en la ejecución del procedimiento ${prcName}`,
        {
          response: (e as Error).message,
        },
        LogLevel.ERROR,
      );
      this.apmService.setLabel('db.operation', prcName);
      this.apmService.captureError(e as Error);
      throw e;
    } finally {
      span?.end();

      await this.closeConnection(conn);
    }
  }

  private async fetchAllFromCursor<T = unknown>(
    cursor: oracledb.ResultSet<T>,
  ): Promise<T[]> {
    const rows: T[] = [];
    try {
      let chunk: T[];
      do {
        chunk = await cursor.getRows(0);
        if (chunk?.length) {
          rows.push(...chunk);
        }
      } while (chunk?.length);
    } finally {
      await cursor.close();
    }

    return rows;
  }

  public isPoolInitialized(): boolean {
    return this.poolInitialized;
  }
}
