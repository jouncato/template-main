/* eslint-disable no-console */
import { Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import * as sql from 'mssql';

import { GlobalModule } from '../../domain/config/global.module';
import config from '../../domain/resources/env.config';

import { SqlServerService } from './sqlserver.service';

@Module({
  providers: [
    SqlServerService,
    {
      provide: 'SQL_CONNECTION',
      useFactory: async (configService: ConfigType<typeof config>) => {
        const pool = new sql.ConnectionPool({
          user: configService.CONNECTION_MSSQL.DB_USERNAME,
          password: configService.CONNECTION_MSSQL.DB_PASSWORD,
          database: configService.CONNECTION_MSSQL.DB_DATABASE,
          server: configService.CONNECTION_MSSQL.DB_SERVER,
          port: Number(configService.CONNECTION_MSSQL.DB_PORT),
          pool: {
            max: configService.POOL.DB_POOL_MAX,
            min: configService.POOL.DB_POOL_MIN,
            idleTimeoutMillis: configService.POOL.DB_POOL_TIMEOUT * 1000,
          },
          connectionTimeout: configService.POOL.DB_QUEUE_TIMEOUT,
          requestTimeout: configService.POOL.DB_QUEUE_TIMEOUT,
          options: {
            encrypt: true,
            trustServerCertificate: true,
          },
        });

        await pool.connect();

        console.log(`✅ Conexión SQL establecida exitosamente`);

        return pool;
      },
      inject: [config.KEY],
    },
  ],
  imports: [GlobalModule],
  exports: ['SQL_CONNECTION', SqlServerService],
})
export class SqlModule implements OnModuleDestroy {
  constructor(
    @Inject('SQL_CONNECTION')
    private readonly sqlConnection: sql.ConnectionPool,
  ) {}

  async onModuleDestroy() {
    await this.sqlConnection.close();
    console.log(
      '🔌 Conexión SQL cerrada correctamente al finalizar la aplicación',
    );
  }
}
