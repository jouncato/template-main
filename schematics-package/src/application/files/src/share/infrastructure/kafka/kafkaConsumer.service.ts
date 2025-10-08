import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import apm from 'elastic-apm-node';
import {
  Admin,
  Consumer,
  EachBatchPayload,
  Kafka,
  KafkaMessage,
} from 'kafkajs';
import pLimit from 'p-limit';

import { AppRequest } from '@src/app/domain/dto/appRequest.dto';
import { IAppService } from '@src/app/domain/interfaces/IAppService';

import { ApmService } from '../../domain/config/apm/apm.service';
import { runWithTx } from '../../domain/config/txid/als';
import { ensureTxId } from '../../domain/config/txid/txid.utils';
import config from '../../domain/resources/env.config';

interface BatchProcessingParams {
  batch: {
    topic: string;
    partition: number;
    messages: KafkaMessage[];
  };
  resolveOffset: (offset: string) => void;
  heartbeat: () => Promise<void>;
  commitOffsetsIfNecessary: () => Promise<void>;
}

@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly admin: Admin;
  private isShuttingDown = false;
  private checkInterval: NodeJS.Timeout;

  constructor(
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
    private readonly apmService: ApmService,
    private readonly createService: IAppService,
  ) {
    this.kafka = new Kafka({
      brokers: [this.configService.KAFKA_URL],
    });

    this.admin = this.kafka.admin();
    this.consumer = this.kafka.consumer({
      groupId: this.configService.GROUP_ID, // 🏷️ Grupo único por instancia
      sessionTimeout: this.configService.SESSION_TIMEOUT, // ⏱️ 10 minutos
      heartbeatInterval: this.configService.HERTBEAT_INTERVAL, // ❤️ Cada 10s
      maxInFlightRequests: this.configService.MAXIN_FLIGHT_REQUESTS, // 🚀 1 petición a la vez
    });
  }

  async onModuleInit() {
    try {
      await this.initializeKafkaConnection();
      await this.startConsumer();
      this.logger.log(
        '🎉 Kafka Consumer iniciado y ejecutándose correctamente',
      );
    } catch (error: unknown) {
      await this.handleConnectionError(error as Error);
    }
  }

  private async initializeKafkaConnection() {
    this.logger.log('🔄 Iniciando conexión a Kafka...');

    await this.admin.connect();
    this.logger.log('✅ Admin conectado exitosamente');

    const isConnected = await this.testKafkaConnection();
    if (!isConnected) {
      throw new Error('No se pudo verificar la conectividad con Kafka');
    }

    await this.consumer.connect();
    this.logger.log('✅ Consumer conectado exitosamente');

    await this.consumer.subscribe({
      topic: this.configService.KAFKA_TOPIC,
      fromBeginning: false,
    });
    this.logger.log('✅ Suscripción al topic realizada correctamente');
  }

  private async startConsumer() {
    await this.consumer.run({
      autoCommit: true,
      eachBatchAutoResolve: true,
      eachBatch: async (params: EachBatchPayload) => {
        await this.processBatch(params);
      },
    });
  }

  private async processBatch({
    batch,
    resolveOffset,
    heartbeat,
    commitOffsetsIfNecessary,
  }: BatchProcessingParams) {
    this.logger.log(
      `📦 Procesando batch con ${batch.messages.length} mensajes en partición ${batch.partition}`,
    );
    const limit = pLimit(this.configService.LIMITKAFKA); // 15 procesos paralelos por batch
    try {
      await Promise.all(
        batch.messages.map((message) =>
          limit(async () => {
            await this.processMessage(
              message,
              batch.topic,
              resolveOffset,
              heartbeat,
              commitOffsetsIfNecessary,
            );
          }),
        ),
      );
      await heartbeat();
    } catch (error: unknown) {
      this.logger.error(
        `❌ Error general en batch: ${(error as Error)?.message}`,
      );
    }
  }

  private async processMessage(
    message: KafkaMessage,
    topic: string,
    resolveOffset: (offset: string) => void,
    heartbeat: () => Promise<void>,
    commitOffsetsIfNecessary: () => Promise<void>,
  ) {
    if (!message.value) return;
    const payload: unknown = JSON.parse(message.value.toString());

    const txId = ensureTxId(payload as Record<string, unknown>);
    await runWithTx(async () => {
      await heartbeat();
      const transaction: apm.Transaction = this.apmService.startTransaction(
        `Kafka Message - ${topic}`,
      );
      const span = transaction?.startSpan(
        `Procesando offset ${message.offset}`,
        'message_processing',
      );

      try {
        await this.processWithHeartbeat(
          () => this.createService.transactionService(payload as AppRequest),
          heartbeat,
        );
        this.logger.log(
          `✅ Offset ${message.offset} confirmado con idtransaction: ${txId}`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Error en offset ${message.offset}: ${(error as Error)?.message}`,
        );
      } finally {
        resolveOffset(message.offset);
        await commitOffsetsIfNecessary();
        span?.end();
        transaction?.end();
      }
    }, txId);
  }

  private async handleConnectionError(error: Error) {
    this.logger.error(`❌ Error al conectar con Kafka: ${error.message}`);
    this.logger.error(`📋 Stack trace: ${error.stack}`);

    // Intentar desconectar conexiones parciales
    try {
      await Promise.allSettled([
        this.consumer.disconnect(),
        this.admin.disconnect(),
      ]);
    } catch (disconnectError: unknown) {
      this.logger.warn(
        `⚠️ Error al desconectar: ${(disconnectError as Error)?.message}`,
      );
    }

    if (!this.isShuttingDown) {
      this.logger.log('🔄 Reintentando conexión en 5 segundos...');
      setTimeout(() => void this.onModuleInit(), 5000);
    }
  }

  async onApplicationShutdown() {
    this.isShuttingDown = true;
    clearInterval(this.checkInterval);
    try {
      this.logger.log('🛑 Cerrando conexiones Kafka...');
      await Promise.all([this.consumer.disconnect(), this.admin.disconnect()]);
      this.logger.log('✅ Conexiones Kafka cerradas correctamente');
    } catch (error: unknown) {
      this.logger.error(
        `❌ Error al cerrar conexiones Kafka: ${(error as Error)?.message}`,
      );
    }
  }

  /**
   * Metodo para verificar la conectividad con Kafka
   */
  private async testKafkaConnection(): Promise<boolean> {
    try {
      this.logger.log('🔍 Verificando conectividad con Kafka...');
      const metadata = await this.admin.fetchTopicMetadata({
        topics: [this.configService.KAFKA_TOPIC],
      });
      this.logger.log(
        `✅ Topic metadata obtenido: ${JSON.stringify(metadata.topics.map((t) => t.name))}`,
      );
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Error al verificar conectividad: ${(error as Error)?.message}`,
      );
      return false;
    }
  }

  private async processWithHeartbeat<T>(
    work: () => Promise<T>,
    heartbeat: () => Promise<void>,
    intervalMs = 10000,
  ): Promise<T> {
    let finished = false;
    const interval = setInterval(() => {
      if (!finished)
        heartbeat().catch((err) =>
          this.logger.warn(`⚠️ Heartbeat fallido: ${(err as Error)?.message}`),
        );
    }, intervalMs);

    try {
      return await work();
    } finally {
      finished = true;
      clearInterval(interval);
    }
  }
}
