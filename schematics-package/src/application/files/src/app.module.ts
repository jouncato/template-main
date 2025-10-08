import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { JobModule } from './app/interfaces/module/job.module';
import { ServiceModule } from './app/interfaces/module/service.module';
import { validateEnvironmentVariables } from './share/domain/config/env/env-validation.schema';
import { GlobalModule } from './share/domain/config/global.module';
import configuration from './share/domain/resources/env.config';

/**
 *  @description clase anotada con un decorador @Module(). El decorador @Module() proporciona
 *  metadatos que Nest utiliza para organizar la estructura de la aplicación.
 *
 *  Con validación automática de variables de entorno usando class-validator
 *
 *  @author Fabrica Digital
 *
 */
@Module({
  providers: [Logger],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironmentVariables,
      expandVariables: true,
      envFilePath: '.env',
    }),
    ServiceModule,
    JobModule,
    GlobalModule,
  ],
})
export class AppModule {}
