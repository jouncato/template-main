import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { HttpService } from '@src/share/infrastructure/http/http.service';

import { JobService } from '../../application/job.service';

/**
 * @description Módulo que configura los jobs programados
 * Siguiendo la arquitectura hexagonal de la plantilla
 *
 * @author Fabrica Digital
 */
@Module({
  imports: [
    ScheduleModule.forRoot({
      cronJobs: true,
    }),
  ],
  providers: [JobService, HttpService],
  exports: [JobService],
})
export class JobModule {}
