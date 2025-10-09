import { Injectable, Inject } from '@nestjs/common';

import { ConfigType } from '@nestjs/config';
import config from '@share/domain/resources/env.config';
import { OracleService } from '@share/infrastructure/oracle/oracle.service';

import { Kafka } from 'kafkajs';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';

/**
 * Health Check Service for Payments Module
 *
 * This service checks the health of infrastructure dependencies used by this module:
 * - ORACLE Database connection
 * - Kafka broker connectivity
 *
 * Each module has its own health check to verify only the resources it depends on.
 * This follows the principle of module isolation in hexagonal architecture.
 *
 * @see GET /payments/health endpoint in the controller
 */
@Injectable()
export class PaymentsHealthService {
  
  constructor(
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
    private readonly oracleService: OracleService,
    private readonly logger: Logger20Service,
  ) {}

  /**
   * Performs health check of all module dependencies
   *
   * @returns Health status object with details of each checked service
   */
  async check(): Promise<HealthCheckResponse> {
    const checks: HealthCheck[] = [];


    // Check Oracle Database
    checks.push(await this.checkOracle());

    // Check Kafka Broker
    checks.push(await this.checkKafka());


    const allHealthy = checks.every(check => check.status === 'up');
    const status = allHealthy ? 'ok' : 'error';

    return {
      status,
      module: 'payments',
      timestamp: new Date().toISOString(),
      checks,
    };
  }


  /**
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


  /**
   * Checks Kafka broker connectivity
   * Attempts to fetch metadata from brokers
   */
  private async checkKafka(): Promise<HealthCheck> {
    try {
      // TODO: Inject Kafka configuration from environment
      const kafka = new Kafka({
        clientId: 'payments-health-check',
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
}

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
