import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaService } from '@share/infrastructure/kafka/kafka.service';

/**
 * <%= classify(moduleName) %> Event Consumer Adapter (Inbound Kafka Consumer)
 *
 * This adapter consumes events from Kafka topics related to <%= dasherize(moduleName) %>.
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
 * Consumer Group: <%= dasherize(moduleName) %>-consumer-group
 * Topics:
 * - external.<%= dasherize(moduleName) %>.events (example)
 * - <%= dasherize(moduleName) %>.commands (example)
 *
 * @example
 * // This consumer will automatically start when the module initializes
 * // Configure topics in the constructor or via configuration
 */
@Injectable()
export class <%= classify(moduleName) %>EventConsumerAdapter implements OnModuleInit {
  private readonly logger = new Logger(<%= classify(moduleName) %>EventConsumerAdapter.name);
  private readonly consumerGroupId = '<%= dasherize(moduleName) %>-consumer-group';

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
        // Example: 'external.<%= dasherize(moduleName) %>.events',
        // Example: '<%= dasherize(moduleName) %>.commands',
      ];

      if (topics.length === 0) {
        this.logger.warn('No topics configured for <%= classify(moduleName) %>EventConsumerAdapter');
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
      case 'External<%= classify(moduleName) %>Created':
        await this.handleExternal<%= classify(moduleName) %>Created(event, key);
        break;

      case 'External<%= classify(moduleName) %>Updated':
        await this.handleExternal<%= classify(moduleName) %>Updated(event, key);
        break;

      case '<%= classify(moduleName) %>Command':
        await this.handle<%= classify(moduleName) %>Command(event, key);
        break;

      default:
        this.logger.warn(`Unknown event type: ${eventType}, skipping...`);
    }
  }

  /**
   * Handle External <%= classify(moduleName) %> Created Event
   *
   * @param event - The event payload
   * @param key - The message key
   */
  private async handleExternal<%= classify(moduleName) %>Created(
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.log(`Handling External<%= classify(moduleName) %>Created for key: ${key}`);

    // TODO: Implement idempotency check
    // Check if this event was already processed to avoid duplicates

    // TODO: Delegate to appropriate use case
    // Example:
    // await this.syncExternalDataUseCase.execute({
    //   externalId: event.payload.id,
    //   data: event.payload,
    // });

    this.logger.log(`Successfully handled External<%= classify(moduleName) %>Created for key: ${key}`);
  }

  /**
   * Handle External <%= classify(moduleName) %> Updated Event
   *
   * @param event - The event payload
   * @param key - The message key
   */
  private async handleExternal<%= classify(moduleName) %>Updated(
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.log(`Handling External<%= classify(moduleName) %>Updated for key: ${key}`);

    // TODO: Implement event handling logic
    // Delegate to use case

    this.logger.log(`Successfully handled External<%= classify(moduleName) %>Updated for key: ${key}`);
  }

  /**
   * Handle <%= classify(moduleName) %> Command
   *
   * @param event - The command payload
   * @param key - The message key
   */
  private async handle<%= classify(moduleName) %>Command(
    event: any,
    key: string,
  ): Promise<void> {
    this.logger.log(`Handling <%= classify(moduleName) %>Command for key: ${key}`);

    // TODO: Implement command handling logic
    // Commands are imperative - they request an action to be performed
    // Delegate to appropriate use case

    this.logger.log(`Successfully handled <%= classify(moduleName) %>Command for key: ${key}`);
  }
}
