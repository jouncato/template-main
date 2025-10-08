/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import './share/domain/config/apm/apm-init';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import compress from '@fastify/compress';
import helmet from '@fastify/helmet';

import { Logger20Service } from './share/domain/config/logger/logger20.service';
import txidPlugin from './share/domain/config/txid/txid.plugin';
import {
  SERVICE_DESCRIPTION,
  SERVICE_VERSION,
} from './share/domain/resources/constants';
import configuration from './share/domain/resources/env.config';
import { AppModule } from './app.module';

/**
 *  @description Archivo de entrada hacia la aplicación que utiliza la función central NestFactory
 *  para crear una instancia de la aplicación Nest.
 *  @author Fabrica Digital
 */

async function bootstrap() {
  const adapter = new FastifyAdapter({
    keepAliveTimeout: 65000,
    maxRequestsPerSocket: 100,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    {
      bufferLogs: true,
    },
  );

  app
    .getHttpAdapter()
    .getInstance()
    .register(txidPlugin as any);
  app.useLogger(app.get(Logger20Service));

  // Registra el plugin de compresión
  await app.register(compress as any, {
    encodings: ['br'],
  });

  await app.register(helmet as any, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  });

  //configuracion libreria para validacion de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = app.get(configuration.KEY);
  const servicePrefix = config.SERVICE_PREFIX;
  const serviceName = config.SERVICE_NAME;

  app.setGlobalPrefix(servicePrefix);

  const configSwagger = new DocumentBuilder()
    .setTitle(serviceName)
    .setDescription(SERVICE_DESCRIPTION)
    .setVersion(SERVICE_VERSION)
    .setContact(
      'Célula Azure',
      'https://www.claro.com.co',
      'desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const documentSwagger = SwaggerModule.createDocument(app, configSwagger, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  const SWAGGER_PATH = 'api';

  SwaggerModule.setup(SWAGGER_PATH, app, documentSwagger, {
    swaggerOptions: {
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      tryItOutEnabled: true,
    },
    customSiteTitle: `${serviceName} API Documentation`,
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = app.get(configuration.KEY).PORT;
  await app.listen(port, '0.0.0.0');

  await app.startAllMicroservices();

  const url = `http://localhost:${port}`;
  const swaggerUrl = `${url}/${SWAGGER_PATH}`;

  app.get(Logger).log(`🚀 Application is running on: ${url}`, 'Main');

  app.get(Logger).log(`📚 Swagger documentation: ${swaggerUrl}`, 'Main');
}
void bootstrap();
