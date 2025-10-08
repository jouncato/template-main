import { registerAs } from '@nestjs/config';

import {
  EnvironmentVariables,
  validateEnvironmentVariables,
} from '../config/env/env-validation.schema';

/**
 *  @description En las aplicaciones de Node.js, es común usar archivos .env, que contienen pares
 *  clave-valor donde cada clave representa un valor particular, para representar cada entorno.
 *  Ejecutar una aplicación en diferentes entornos es solo una cuestión de intercambiar el
 *  archivo .env correcto.
 *
 *  @author Celula Azure
 *
 */

const getAppConfig = (config: EnvironmentVariables) => ({
  SERVICE_NAME: config.SERVICE_NAME,
  PORT: config.PORT,
  TIMEOUT: config.TIMEOUT,
  SERVICE_PREFIX: config.SERVICE_PREFIX,
  CONTROLLER_PATH: config.CONTROLLER_PATH,
  MAX_LOG_SIZE: config.MAX_LOG_SIZE,
  APM: {
    HOST: config.ELASTIC_APM_SERVER_URL,
    ENVIRONMENT: config.ELASTIC_APM_ENVIRONMENT,
    ISACTIVE: config.ELASTIC_APM_ACTIVE,
  },
});

const getDatabaseConfig = (config: EnvironmentVariables) => ({
  CONNECTION_MSSQL: {
    DB_USERNAME: config.DB_USERNAME,
    DB_PASSWORD: config.DB_PASSWORD,
    DB_DATABASE: config.DB_DATABASE,
    DB_SERVER: config.DB_SERVER,
    DB_PORT: config.DB_PORT,
  },
  CONNECTION_ORACLE: {
    DB_USERNAME: config.DB_USERNAME,
    DB_PASSWORD: config.DB_PASSWORD,
    DB_CONNECTSTRING: config.DB_CONNECTSTRING,
  },
  POOL: {
    DB_POOL_ALIAS: config.DB_POOL_ALIAS, // ORACLE
    DB_POOL_MIN: config.DB_POOL_MIN,
    DB_POOL_MAX: config.DB_POOL_MAX,
    DB_POOL_INCREMENT: config.DB_POOL_INCREMENT,
    DB_POOL_TIMEOUT: config.DB_POOL_TIMEOUT,
    DB_QUEUE_TIMEOUT: config.DB_QUEUE_TIMEOUT,
    DB_STMT_CACHE_SIZE: config.DB_STMT_CACHE_SIZE,
  },
  PROCEDURES: {
    PRC_CONSULT_CLIENT: config.PRC_CONSULT_CLIENT,
  },
});

const getHttpConfig = (config: EnvironmentVariables) => ({
  HTTP: {
    TIMEOUT: config.HTTP_TIMEOUT,
    DISABLE_SSL_VERIFICATION: config.DISABLE_SSL_VERIFICATION,
    KEEP_ALIVE: config.HTTP_KEEP_ALIVE,
  },
  LEGACIES: {},
});

const getKafkaConfig = (config: EnvironmentVariables) => ({
  KAFKA_URL: config.KAFKA_URL,
  KAFKA_TOPIC: config.KAFKA_TOPIC,
  GROUP_ID: config.GROUP_ID,
  SESSION_TIMEOUT: config.SESSION_TIMEOUT,
  HERTBEAT_INTERVAL: config.HERTBEAT_INTERVAL,
  MAXIN_FLIGHT_REQUESTS: config.MAXIN_FLIGHT_REQUESTS,
  LIMITKAFKA: config.LIMITKAFKA,
});

const getJobsConfig = (config: EnvironmentVariables) => ({
  CRON_EXPRESSION: config.CRON_EXPRESSION,
});

const validateAndGetConfig = (): EnvironmentVariables =>
  validateEnvironmentVariables({ ...process.env });

export default registerAs('configuration', () => {
  const validatedConfig = validateAndGetConfig();

  return {
    ...getAppConfig(validatedConfig),
    ...getDatabaseConfig(validatedConfig),
    ...getHttpConfig(validatedConfig),
    ...getKafkaConfig(validatedConfig),
    ...getJobsConfig(validatedConfig),
  };
});
