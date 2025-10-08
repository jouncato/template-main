import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import * as sql from 'mssql';

import { Logger20Service } from '@share/domain/config/logger/logger20.service';
import config from '@share/domain/resources/env.config';
import { OracleService } from '@share/infrastructure/oracle/oracle.service';

/**
 * @class HealthService
 * Clase para comprobar el estado de los servicios consumidos por el módulo
 */
@Injectable()
export class HealthService {
  constructor(
    @Inject('SQL_CONNECTION')
    private readonly pool: sql.ConnectionPool,
    @Inject(config.KEY)
    private configService: ConfigType<typeof config>,
    private readonly logger: Logger20Service,
    private readonly oracleService: OracleService,
  ) {}

  async check() {
    try {
      const mssqlCheck = await this.checkMssql();
      const oracleCheck = await this.checkOracle();

      const allChecksHealthy =
        mssqlCheck.status === 'up' && oracleCheck.status === 'up';
      const status = allChecksHealthy ? 'ok' : 'error';

      const result = {
        status,
        info: allChecksHealthy
          ? {
              mssql: mssqlCheck,
              oracle: oracleCheck,
            }
          : {},
        error: allChecksHealthy
          ? {}
          : {
              ...(mssqlCheck.status === 'down' ? { mssql: mssqlCheck } : {}),
              ...(oracleCheck.status === 'down' ? { oracle: oracleCheck } : {}),
            },
        details: {
          mssql: mssqlCheck,
          oracle: oracleCheck,
        },
      };

      const httpCode = allChecksHealthy
        ? HttpStatus.OK
        : HttpStatus.INTERNAL_SERVER_ERROR;

      if (!allChecksHealthy) {
        throw new HttpException({ httpCode, ...result }, httpCode);
      }

      return { httpCode, ...result };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error during health check', error as Error);

      const errorResponse = {
        status: 'error',
        error: {
          general: {
            status: 'down',
            message:
              (error as Error)?.message || 'Unknown error during health check',
          },
        },
        details: {
          general: {
            status: 'down',
            message:
              (error as Error)?.message || 'Unknown error during health check',
          },
        },
      };

      const httpCode = HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException({ httpCode, ...errorResponse }, httpCode);
    }
  }

  /**
   * Verifica el estado de la conexión a la base de datos MSSQL
   */
  private async checkMssql() {
    try {
      if (!this.pool?.connected) {
        return {
          status: 'down',
          isConnected: false,
          message: 'Database connection pool is not connected',
        };
      }

      // Realizar una consulta simple para verificar la conectividad
      const request = this.pool.request();
      const result = await request.query('SELECT 1 as test');

      if (result && result.recordset && result.recordset.length > 0) {
        return {
          status: 'up',
          isConnected: true,
          message: 'Database is connected and responsive',
        };
      } else {
        return {
          status: 'down',
          isConnected: false,
          message: 'Database query returned unexpected result',
        };
      }
    } catch (error: unknown) {
      this.logger.error('Error checking database health', error as Error);
      return {
        status: 'down',
        isConnected: false,
        message: `Database health check failed: ${(error as Error)?.message}`,
        error: (error as Error)?.message,
      };
    }
  }

  /**
   * Verifica el estado de la conexión a la base de datos Oracle
   */
  private async checkOracle() {
    try {
      if (!this.oracleService.isPoolInitialized()) {
        return {
          status: 'down',
          isConnected: false,
          message: 'Oracle connection pool is not initialized',
        };
      }

      const poolAlias =
        this.configService?.POOL?.DB_POOL_ALIAS ??
        this.configService.SERVICE_NAME.toLowerCase();
      const connection = await this.oracleService.getConnection(poolAlias);

      try {
        const result = await connection.execute('SELECT 1 FROM DUAL');

        if (result && result.rows && result.rows.length > 0) {
          return {
            status: 'up',
            isConnected: true,
            message: 'Oracle database is connected and responsive',
          };
        } else {
          return {
            status: 'down',
            isConnected: false,
            message: 'Oracle query returned unexpected result',
          };
        }
      } finally {
        await this.oracleService.closeConnection(connection);
      }
    } catch (error) {
      this.logger.error('Error checking Oracle health', error as Error);
      return {
        status: 'down',
        isConnected: false,
        message: `Oracle health check failed: ${(error as Error)?.message}`,
        error: (error as Error)?.message,
      };
    }
  }
}
