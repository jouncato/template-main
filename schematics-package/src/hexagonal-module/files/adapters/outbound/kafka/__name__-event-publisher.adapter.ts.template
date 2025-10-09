import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from '@share/infrastructure/kafka/kafka.service';
import { I<%= classify(moduleName) %>EventPublisher } from '../../../domain/ports/i-<%= dasherize(moduleName) %>-event-publisher.port';

/**
 * <%= classify(moduleName) %> Event Publisher Adapter (Outbound Kafka Producer)
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
 * - Implements the I<%= classify(moduleName) %>EventPublisher port interface
 * - Depends on shared KafkaService for infrastructure concerns
 * - Domain layer knows nothing about Kafka - only the port interface
 * - Can be replaced with other message brokers (RabbitMQ, SNS, etc.)
 *
 * Event Topics:
 * - <%= dasherize(moduleName) %>.created
 * - <%= dasherize(moduleName) %>.updated
 * - <%= dasherize(moduleName) %>.deleted
 *
 * @see I<%= classify(moduleName) %>EventPublisher
 */
@Injectable()
export class <%= classify(moduleName) %>EventPublisherAdapter implements I<%= classify(moduleName) %>EventPublisher {
  private readonly logger = new Logger(<%= classify(moduleName) %>EventPublisherAdapter.name);
  private readonly topicPrefix = '<%= dasherize(moduleName) %>';

  constructor(private readonly kafkaService: KafkaService) {}

  /**
   * Publish <%= classify(moduleName) %> Created Event
   *
   * @param event - The event payload containing created entity data
   */
  async publish<%= classify(moduleName) %>CreatedEvent(event: {
    id: string;
    name: string;
    occurredAt: Date;
    [key: string]: any;
  }): Promise<void> {
    const topic = `${this.topicPrefix}.created`;
    
    try {
      this.logger.log(`Publishing <%= classify(moduleName) %>CreatedEvent to topic: ${topic}`);

      await this.kafkaService.publish({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              eventType: '<%= classify(moduleName) %>Created',
              eventVersion: '1.0',
              occurredAt: event.occurredAt.toISOString(),
              payload: {
                id: event.id,
                name: event.name,
                // TODO: Add additional event payload fields
              },
            }),
            headers: {
              'event-type': '<%= classify(moduleName) %>Created',
              'event-version': '1.0',
              'correlation-id': event.id,
            },
          },
        ],
      });

      this.logger.log(`Successfully published <%= classify(moduleName) %>CreatedEvent for ID: ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish <%= classify(moduleName) %>CreatedEvent for ID ${event.id}: ${error.message}`,
        error.stack
      );
      // TODO: Implement retry logic or dead letter queue
      throw error;
    }
  }

  /**
   * Publish <%= classify(moduleName) %> Updated Event
   *
   * @param event - The event payload containing updated entity data
   */
  async publish<%= classify(moduleName) %>UpdatedEvent(event: {
    id: string;
    changes: any;
    occurredAt: Date;
    [key: string]: any;
  }): Promise<void> {
    const topic = `${this.topicPrefix}.updated`;
    
    try {
      this.logger.log(`Publishing <%= classify(moduleName) %>UpdatedEvent to topic: ${topic}`);

      await this.kafkaService.publish({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              eventType: '<%= classify(moduleName) %>Updated',
              eventVersion: '1.0',
              occurredAt: event.occurredAt.toISOString(),
              payload: {
                id: event.id,
                changes: event.changes,
                // TODO: Add additional event payload fields
              },
            }),
            headers: {
              'event-type': '<%= classify(moduleName) %>Updated',
              'event-version': '1.0',
              'correlation-id': event.id,
            },
          },
        ],
      });

      this.logger.log(`Successfully published <%= classify(moduleName) %>UpdatedEvent for ID: ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish <%= classify(moduleName) %>UpdatedEvent for ID ${event.id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Publish <%= classify(moduleName) %> Deleted Event
   *
   * @param event - The event payload containing deleted entity data
   */
  async publish<%= classify(moduleName) %>DeletedEvent(event: {
    id: string;
    deletionType: 'soft' | 'hard';
    occurredAt: Date;
    [key: string]: any;
  }): Promise<void> {
    const topic = `${this.topicPrefix}.deleted`;
    
    try {
      this.logger.log(`Publishing <%= classify(moduleName) %>DeletedEvent to topic: ${topic}`);

      await this.kafkaService.publish({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify({
              eventType: '<%= classify(moduleName) %>Deleted',
              eventVersion: '1.0',
              occurredAt: event.occurredAt.toISOString(),
              payload: {
                id: event.id,
                deletionType: event.deletionType,
                // TODO: Add additional event payload fields
              },
            }),
            headers: {
              'event-type': '<%= classify(moduleName) %>Deleted',
              'event-version': '1.0',
              'correlation-id': event.id,
            },
          },
        ],
      });

      this.logger.log(`Successfully published <%= classify(moduleName) %>DeletedEvent for ID: ${event.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish <%= classify(moduleName) %>DeletedEvent for ID ${event.id}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
