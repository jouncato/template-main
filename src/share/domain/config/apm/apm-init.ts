/* eslint-disable no-console */
import 'dotenv/config';

import apm from 'elastic-apm-node';

const env = (k: string) => process.env?.[k];

const isActive = env('ELASTIC_APM_ACTIVE') === 'true';

if (isActive && !apm.isStarted()) {
  const serviceName = env('SERVICE_NAME') || 'EstandarNetjs';

  console.log('🎯 Inicializando APM Agent...');

  apm.start({
    //#NOMBRE DE LA APP, CON ESTE NOMBRE TAMBIEN SE VA GUARDE EL INDICE DE APM
    serviceName: serviceName,

    // URL del servidor APM desde variables de entorno
    serverUrl: env('ELASTIC_APM_SERVER_URL'),

    // Entorno desde variables de entorno
    environment: env('ELASTIC_APM_ENVIRONMENT') || 'development',

    // The HTTP body of incoming HTTP requests
    captureBody: 'all',

    // Use if APM Server requires a token
    secretToken: env('ELASTIC_APM_SECRET_TOKEN') || '',

    // Monitor for aborted TCP connections with un-ended HTTP requests
    errorOnAbortedRequests: true,

    // Any finite integer value will be used as the maximum number of frames to collect
    stackTraceLimit: 500,

    // Configuraciones adicionales para mejor captura
    active: true,
    metricsInterval: '30s',
    transactionSampleRate: 1.0,
    captureExceptions: true,
    captureErrorLogStackTraces: 'always',

    // CRÍTICO: Habilitar instrumentación automática HTTP para Fastify
    instrument: true,
    instrumentIncomingHTTPRequests: true,

    // Configuración para evitar caracteres ilegales en tags
    sanitizeFieldNames: ['_'],
    useElasticTraceparentHeader: true,

    // Capturar headers para mejor contexto
    captureHeaders: true,

    // Configuración de logs
    logLevel: (env('ELASTIC_APM_LOG_LEVEL') ?? 'info') as apm.LogLevel,
  });

  apm.setGlobalLabel?.('region', 'co');
  apm.setGlobalLabel?.('runtime', 'node');
  apm.setGlobalLabel?.('framework', 'nestjs');

  console.log('🎯 APM Agent iniciado correctamente');
} else if (!isActive) {
  console.log('⚠️ APM Agent está deshabilitado (ELASTIC_APM_ACTIVE=false)');
} else {
  console.log('🎯 APM Agent ya estaba iniciado');
}

export default apm;
