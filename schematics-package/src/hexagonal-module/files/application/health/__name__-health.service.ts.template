import { Injectable, Inject<% if (database === 'mssql') { %>, Logger<% } %> } from '@nestjs/common';
<% if (database === 'mssql') { %>import * as sql from 'mssql';<% } %>
<% if (database === 'oracle') { %>import { ConfigType } from '@nestjs/config';
import config from '@share/domain/resources/env.config';
import { OracleService } from '@share/infrastructure/oracle/oracle.service';<% } %>
<% if (database === 'mongodb') { %>import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';<% } %>
<% if (kafka !== 'none') { %>import { Kafka } from 'kafkajs';<% } %>
import { Logger20Service } from '@share/domain/config/logger/logger20.service';

/**
 * Health Check Service for <%= classify(moduleName) %> Module
 *
 * This service checks the health of infrastructure dependencies used by this module:
<% if (database !== 'none') { %> * - <%= database.toUpperCase() %> Database connection<% } %>
<% if (kafka !== 'none') { %> * - Kafka broker connectivity<% } %>
 *
 * Each module has its own health check to verify only the resources it depends on.
 * This follows the principle of module isolation in hexagonal architecture.
 *
 * @see GET /<%= dasherize(moduleName) %>/health endpoint in the controller
 */
@Injectable()
export class <%= classify(moduleName) %>HealthService {
  <% if (database === 'mssql') { %>private readonly logger = new Logger(<%= classify(moduleName) %>HealthService.name);
  <% } %>
  constructor(
<% if (database === 'mssql') { %>    @Inject('SQL_CONNECTION')
    private readonly pool: sql.ConnectionPool,
<% } %><% if (database === 'oracle') { %>    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
    private readonly oracleService: OracleService,
<% } %><% if (database === 'mongodb') { %>    @InjectConnection()
    private readonly connection: Connection,
<% } %>    private readonly logger: Logger20Service,
  ) {}

  /**
   * Performs health check of all module dependencies
   *
   * @returns Health status object with details of each checked service
   */
  async check(): Promise<HealthCheckResponse> {
    const checks: HealthCheck[] = [];

<% if (database === 'mssql') { %>    // Check MSSQL Database
    checks.push(await this.checkMssql());<% } %>
<% if (database === 'oracle') { %>    // Check Oracle Database
    checks.push(await this.checkOracle());<% } %>
<% if (database === 'mongodb') { %>    // Check MongoDB
    checks.push(await this.checkMongoDB());<% } %>
<% if (kafka !== 'none') { %>    // Check Kafka Broker
    checks.push(await this.checkKafka());<% } %>
<% if (database === 'none' && kafka === 'none') { %>    // No external dependencies - always healthy
    checks.push({
      name: '<%= moduleName %>-service',
      status: 'up',
      message: 'Module has no external dependencies',
    });<% } %>

    const allHealthy = checks.every(check => check.status === 'up');
    const status = allHealthy ? 'ok' : 'error';

    return {
      status,
      module: '<%= moduleName %>',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

<% if (database === 'mssql') { %>  /**
   * Checks MSSQL database connection health
   * Executes a simple SELECT 1 query to verify connectivity
   */
  private async checkMssql(): Promise<HealthCheck> {
    try {
      if (!this.pool?.connected) {
        return {
          name: 'mssql',
          status: 'down',
          message: 'Database connection pool is not connected',
        };
      }

      const request = this.pool.request();
      const result = await request.query('SELECT 1 as test');

      if (result && result.recordset && result.recordset.length > 0) {
        return {
          name: 'mssql',
          status: 'up',
          message: 'Database is connected and responsive',
          details: {
            server: this.pool.config.server,
            database: this.pool.config.database,
          },
        };
      } else {
        return {
          name: 'mssql',
          status: 'down',
          message: 'Database query returned unexpected result',
        };
      }
    } catch (error: unknown) {
      this.logger.error('MSSQL health check failed', error as Error);
      return {
        name: 'mssql',
        status: 'down',
        message: `Database health check failed: ${(error as Error)?.message}`,
        error: (error as Error)?.message,
      };
    }
  }
<% } %>
<% if (database === 'oracle') { %>  /**
   * Checks Oracle database connection health
   * Executes SELECT 1 FROM DUAL to verify connectivity
   */
  private async checkOracle(): Promise<HealthCheck> {
    try {
      if (!this.oracleService.isPoolInitialized()) {
        return {
          name: 'oracle',
          status: 'down',
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
            name: 'oracle',
            status: 'up',
            message: 'Oracle database is connected and responsive',
            details: {
              poolAlias,
            },
          };
        } else {
          return {
            name: 'oracle',
            status: 'down',
            message: 'Oracle query returned unexpected result',
          };
        }
      } finally {
        await this.oracleService.closeConnection(connection);
      }
    } catch (error) {
      this.logger.error('Oracle health check failed', error as Error);
      return {
        name: 'oracle',
        status: 'down',
        message: `Oracle health check failed: ${(error as Error)?.message}`,
        error: (error as Error)?.message,
      };
    }
  }
<% } %>
<% if (database === 'mongodb') { %>  /**
   * Checks MongoDB connection health
   * Verifies connection state and executes admin ping command
   */
  private async checkMongoDB(): Promise<HealthCheck> {
    try {
      if (this.connection.readyState !== 1) {
        return {
          name: 'mongodb',
          status: 'down',
          message: 'MongoDB connection is not ready',
          details: {
            readyState: this.connection.readyState,
          },
        };
      }

      // Execute ping command to verify responsiveness
      await this.connection.db.admin().ping();

      return {
        name: 'mongodb',
        status: 'up',
        message: 'MongoDB is connected and responsive',
        details: {
          host: this.connection.host,
          name: this.connection.name,
        },
      };
    } catch (error) {
      this.logger.error('MongoDB health check failed', error as Error);
      return {
        name: 'mongodb',
        status: 'down',
        message: `MongoDB health check failed: ${(error as Error)?.message}`,
        error: (error as Error)?.message,
      };
    }
  }
<% } %>
<% if (kafka !== 'none') { %>  /**
   * Checks Kafka broker connectivity
   * Attempts to fetch metadata from brokers
   */
  private async checkKafka(): Promise<HealthCheck> {
    try {
      // TODO: Inject Kafka configuration from environment
      const kafka = new Kafka({
        clientId: '<%= dasherize(moduleName) %>-health-check',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      });

      const admin = kafka.admin();

      try {
        await admin.connect();

        // Fetch cluster metadata as health check
        const cluster = await admin.describeCluster();

        await admin.disconnect();

        return {
          name: 'kafka',
          status: 'up',
          message: 'Kafka broker is reachable',
          details: {
            brokers: cluster.brokers.length,
            controller: cluster.controller,
          },
        };
      } catch (error) {
        await admin.disconnect();
        throw error;
      }
    } catch (error) {
      this.logger.error('Kafka health check failed', error as Error);
      return {
        name: 'kafka',
        status: 'down',
        message: `Kafka health check failed: ${(error as Error)?.message}`,
        error: (error as Error)?.message,
      };
    }
  }
<% } %>}

/**
 * Health check response structure
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  module: string;
  timestamp: string;
  checks: HealthCheck[];
}

/**
 * Individual service health check result
 */
export interface HealthCheck {
  name: string;
  status: 'up' | 'down';
  message: string;
  details?: Record<string, any>;
  error?: string;
}
