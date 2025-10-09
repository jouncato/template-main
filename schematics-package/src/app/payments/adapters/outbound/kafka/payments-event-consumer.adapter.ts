import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '@share/infrastructure/kafka/kafka.service';

/**
 * Payments Event Consumer Adapter (Inbound Kafka Consumer)
 *
 * This adapter consumes events from Kafka topics related to payments.
 * It can react to events from other bounded contexts or external systems.
 *
 * Responsibilities:
 * - Subscribe to relevant Kafka topics
 * - Deserialize and validate incoming messages
 * - Trigger appropriate use cases or domain services
 * - Handle consumer errors and retries
 * - Maintain consumer offset management
 *
 * Architecture Notes:
 * - Acts as an inbound adapter for event-driven communication
 * - Translates Kafka messages into domain operations
 * - Should delegate business logic to use cases
 * - Implements idempotency to handle duplicate messages
 *
 * Consumer Group: payments-consumer-group
 * Topics:
 * - external.payments.events (example)
 * - payments.commands (example)
 *
 * @example
 * // This consumer will automatically start when the module initializes
 * // Configure topics in the constructor or via configuration
 */
@Injectable()
export class PaymentsEventConsumerAdapter implements OnModuleInit {
  private readonly logger = new Logger(PaymentsEventConsumerAdapter.name);
  private readonly consumerGroupId = 'payments-consumer-group';

  constructor(
    private readonly kafkaService: KafkaService,
    // TODO: Inject use cases that should be triggered by events
    // Example: private readonly processEventUseCase: ProcessEventUseCase,
  ) {}

  /**
   * Initialize the consumer when the module starts
   */
  async onModuleInit() {
    await this.subscribeToTopics();
  }

  /**
   * Subscribe to Kafka topics
   */
  private async subscribeToTopics(): Promise<void> {
    try {
      this.logger.log('Subscribing to Kafka topics...');

      // TODO: Configure your topics here
      const topics = [
        // Example: 'external.payments.events',
        // Example: 'payments.commands',
      ];

      if (topics.length === 0) {
        this.logger.warn('No topics configured for PaymentsEventConsumerAdapter');
        return;
      }

      await this.kafkaService.subscribe({
        topics,
        groupId: this.consumerGroupId,
        fromBeginning: false, // Set to true for replay scenarios
      });

      // Register message handler
      await this.kafkaService.consume({
        groupId: this.consumerGroupId,
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleMessage(topic, partition, message);
        },
      });

      this.logger.log(`Successfully subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to Kafka topics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle incoming Kafka message
   *
   * @param topic - The topic from which the message was received
   * @param partition - The partition number
   * @param message - The Kafka message
   */
  private async handleMessage(
    topic: string,
    partition: number,
    message: any,
  ): Promise<void> {
    try {
      const key = message.key?.toString();
      const value = message.value?.toString();
      const headers = message.headers;

      this.logger.log(
        `Received message from topic: ${topic}, partition: ${partition}, key: ${key}`
      );

      if (!value) {
        this.logger.warn('Received empty message, skipping...');
        return;
      }

      // Parse message
      const event = JSON.parse(value);
      const eventType = headers?.['event-type']?.toString() || event.eventType;

      // Route to appropriate handler based on event type
      await this.routeEvent(eventType, event, key);

      this.logger.log(`Successfully processed message with key: ${key}`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic ${topic}: ${error.message}`,
        error.stack
      );
      
      // TODO: Implement error handling strategy
      // - Dead letter queue
      // - Retry with exponential backoff
      // - Alert/monitoring
      throw error; // Will trigger Kafka retry based on consumer config
    }
  }

  /**
   * Route event to appropriate handler
   *
   * @param eventType - The type of event
   * @param event - The event payload
   * @param key - The message key (usually entity ID)
   */
  private async routeEvent(
    eventType: string,
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.debug(`Routing event type: ${eventType}`);

    switch (eventType) {
      case 'ExternalPaymentsCreated':
        await this.handleExternalPaymentsCreated(event, key);
        break;

      case 'ExternalPaymentsUpdated':
        await this.handleExternalPaymentsUpdated(event, key);
        break;

      case 'PaymentsCommand':
        await this.handlePaymentsCommand(event, key);
        break;

      default:
        this.logger.warn(`Unknown event type: ${eventType}, skipping...`);
    }
  }

  /**
   * Handle External Payments Created Event
   *
   * @param event - The event payload
   * @param key - The message key
   */
  private async handleExternalPaymentsCreated(
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.log(`Handling ExternalPaymentsCreated for key: ${key}`);

    // TODO: Implement idempotency check
    // Check if this event was already processed to avoid duplicates

    // TODO: Delegate to appropriate use case
    // Example:
    // await this.syncExternalDataUseCase.execute({
    //   externalId: event.payload.id,
    //   data: event.payload,
    // });

    this.logger.log(`Successfully handled ExternalPaymentsCreated for key: ${key}`);
  }

  /**
   * Handle External Payments Updated Event
   *
   * @param event - The event payload
   * @param key - The message key
   */
  private async handleExternalPaymentsUpdated(
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.log(`Handling ExternalPaymentsUpdated for key: ${key}`);

    // TODO: Implement event handling logic
    // Delegate to use case

    this.logger.log(`Successfully handled ExternalPaymentsUpdated for key: ${key}`);
  }

  /**
   * Handle Payments Command
   *
   * @param event - The command payload
   * @param key - The message key
   */
  private async handlePaymentsCommand(
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.log(`Handling PaymentsCommand for key: ${key}`);

    // TODO: Implement command handling logic
    // Commands are imperative - they request an action to be performed
    // Delegate to appropriate use case

    this.logger.log(`Successfully handled PaymentsCommand for key: ${key}`);
  }
}
