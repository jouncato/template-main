import { Module } from '@nestjs/common';

import { AppService } from '../../application/app.service';
import { AppController } from '../controller/app.controller';

/**
 *  @description clase anotada con un decorador @Module(). El decorador @Module() proporciona
 *  metadatos que Nest utiliza para organizar la estructura de la aplicación.
 *
 *  @author Fabrica Digital
 *
 */
@Module({
  imports: [
     HealthModule,
     SqlModule
     OracleModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseService
  ],
})
export class ServiceModule {}
