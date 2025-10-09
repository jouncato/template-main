import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '@share/infrastructure/kafka/kafka.service';
import { IPaymentsEventPublisher } from '../../../domain/ports/i-payments-event-publisher.port';

/**
 * Payments Event Publisher Adapter (Outbound Kafka Producer)
 *
 * This adapter implements the event publisher port for Kafka.
 * It translates domain events into Kafka messages.
 *
 * Responsibilities:
 * - Publish domain events to Kafka topics
 * - Handle serialization and schema validation
 * - Manage producer configuration and error handling
 * - Ensure at-least-once delivery semantics
 *
 * Architecture Notes:
 * - Implements the IPaymentsEventPublisher port interface
 * - Depends on shared KafkaService for infrastructure concerns
 * - Domain layer knows nothing about Kafka - only the port interface
 * - Can be replaced with other message brokers (RabbitMQ, SNS, etc.)
 *
 * Event Topics:
 * - payments.created
 * - payments.updated
 * - payments.deleted
 *
 * @see IPaymentsEventPublisher
 */
@Injectable()
export class PaymentsEventPublisherAdapter implements IPaymentsEventPublisher {
  private readonly logger = new Logger(PaymentsEventPublisherAdapter.name);
  private readonly topicPrefix = 'payments';

  constructor(private readonly kafkaService: KafkaService) {}

  /**
   * Publish Payments Created Event
   *
   * @param event - The event payload containing created entity data
   */
  async publishPaymentsCreatedEvent(event: {
    id: string;
    name: string;
    occurredAt: Date;
    [key: string]: any;
  }): Promise<void> {
    const topic = `${this.topicPrefix}.created`;
    
    try {
      this.logger.log(`Publishing PaymentsCreatedEvent to topic: ${topic}`);

      await this.kafkaService.publish({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              eventType: 'PaymentsCreated',
              eventVersion: '1.0',
              occurredAt: event.occurredAt.toISOString(),
              payload: {
                id: event.id,
                name: event.name,
                // TODO: Add additional event payload fields
              },
            }),
            headers: {
              'event-type': 'PaymentsCreated',
              'event-version': '1.0',
              'correlation-id': event.id,
            },
          },
        ],
      });

      this.logger.log(`Successfully published PaymentsCreatedEvent for ID: ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish PaymentsCreatedEvent for ID ${event.id}: ${error.message}`,
        error.stack
      );
      // TODO: Implement retry logic or dead letter queue
      throw error;
    }
  }

  /**
   * Publish Payments Updated Event
   *
   * @param event - The event payload containing updated entity data
   */
  async publishPaymentsUpdatedEvent(event: {
    id: string;
    changes: any;
    occurredAt: Date;
    [key: string]: any;
  }): Promise<void> {
    const topic = `${this.topicPrefix}.updated`;
    
    try {
      this.logger.log(`Publishing PaymentsUpdatedEvent to topic: ${topic}`);

      await this.kafkaService.publish({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              eventType: 'PaymentsUpdated',
              eventVersion: '1.0',
              occurredAt: event.occurredAt.toISOString(),
              payload: {
                id: event.id,
                changes: event.changes,
                // TODO: Add additional event payload fields
              },
            }),
            headers: {
              'event-type': 'PaymentsUpdated',
              'event-version': '1.0',
              'correlation-id': event.id,
            },
          },
        ],
      });

      this.logger.log(`Successfully published PaymentsUpdatedEvent for ID: ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish PaymentsUpdatedEvent for ID ${event.id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish Payments Deleted Event
   *
   * @param event - The event payload containing deleted entity data
   */
  async publishPaymentsDeletedEvent(event: {
    id: string;
    deletionType: 'soft' | 'hard';
    occurredAt: Date;
    [key: string]: any;
  }): Promise<void> {
    const topic = `${this.topicPrefix}.deleted`;
    
    try {
      this.logger.log(`Publishing PaymentsDeletedEvent to topic: ${topic}`);

      await this.kafkaService.publish({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              eventType: 'PaymentsDeleted',
              eventVersion: '1.0',
              occurredAt: event.occurredAt.toISOString(),
              payload: {
                id: event.id,
                deletionType: event.deletionType,
                // TODO: Add additional event payload fields
              },
            }),
            headers: {
              'event-type': 'PaymentsDeleted',
              'event-version': '1.0',
              'correlation-id': event.id,
            },
          },
        ],
      });

      this.logger.log(`Successfully published PaymentsDeletedEvent for ID: ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish PaymentsDeletedEvent for ID ${event.id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
