import { <%= classify(moduleName) %>Entity } from '../entities/<%= dasherize(moduleName) %>.entity';

/**
 * <%= classify(moduleName) %> Event Publisher Port (Outbound Port)
 *
 * This is an OUTBOUND PORT for publishing domain events to external systems (e.g., Kafka).
 *
 * Key principles:
 * - This is an OUTBOUND port (domain -> infrastructure/messaging)
 * - The domain layer defines what events need to be published
 * - The infrastructure layer implements how to publish them (e.g., Kafka adapter)
 * - Enables event-driven architecture and microservice communication
 * - Domain remains independent of messaging infrastructure
 *
 * Implementation location:
 * - This interface lives in: domain/ports/
 * - The concrete implementation lives in: infrastructure/messaging/publishers/
 *
 * Benefits:
 * - Domain can emit events without knowing about Kafka or other messaging systems
 * - Easy to swap messaging infrastructure (Kafka, RabbitMQ, SQS, etc.)
 * - Testable with mock implementations
 * - Clear contract for what events the system produces
 */

export abstract class I<%= classify(moduleName) %>EventPublisher {
  /**
   * Publish event when a new <%= classify(moduleName) %> is created
   *
   * @param event - The creation event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishCreated(
    event: <%= classify(moduleName) %>CreatedEvent,
  ): Promise<void>;

  /**
   * Publish event when a <%= classify(moduleName) %> is updated
   *
   * @param event - The update event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishUpdated(
    event: <%= classify(moduleName) %>UpdatedEvent,
  ): Promise<void>;

  /**
   * Publish event when a <%= classify(moduleName) %> is deleted
   *
   * @param event - The deletion event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishDeleted(
    event: <%= classify(moduleName) %>DeletedEvent,
  ): Promise<void>;

  /**
   * Publish event when a <%= classify(moduleName) %> status changes
   *
   * @param event - The status change event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishStatusChanged(
    event: <%= classify(moduleName) %>StatusChangedEvent,
  ): Promise<void>;

  /**
   * Publish a custom domain event
   *
   * @param event - The custom event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishCustomEvent(
    event: <%= classify(moduleName) %>CustomEvent,
  ): Promise<void>;
}

/**
 * Base interface for all <%= classify(moduleName) %> events
 */
export interface Base<%= classify(moduleName) %>Event {
  /**
   * Unique identifier for the event
   */
  eventId: string;

  /**
   * Type of the event (e.g., 'created', 'updated', 'deleted')
   */
  eventType: string;

  /**
   * Timestamp when the event occurred
   */
  timestamp: Date;

  /**
   * Version of the event schema (for evolution)
   */
  version: string;

  /**
   * Correlation ID for tracking related events
   */
  correlationId?: string;

  /**
   * User or system that triggered the event
   */
  triggeredBy?: string;
}

/**
 * Event payload for <%= classify(moduleName) %> creation
 */
export interface <%= classify(moduleName) %>CreatedEvent extends Base<%= classify(moduleName) %>Event {
  eventType: '<%= dasherize(moduleName) %>.created';

  /**
   * The created entity data
   */
  data: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Event payload for <%= classify(moduleName) %> update
 */
export interface <%= classify(moduleName) %>UpdatedEvent extends Base<%= classify(moduleName) %>Event {
  eventType: '<%= dasherize(moduleName) %>.updated';

  /**
   * The updated entity data
   */
  data: {
    id: string;
    name: string;
    status: string;
    updatedAt: Date;
  };

  /**
   * Fields that were changed in this update
   */
  changedFields: string[];

  /**
   * Previous values of changed fields (for audit trail)
   */
  previousValues?: Record<string, any>;
}

/**
 * Event payload for <%= classify(moduleName) %> deletion
 */
export interface <%= classify(moduleName) %>DeletedEvent extends Base<%= classify(moduleName) %>Event {
  eventType: '<%= dasherize(moduleName) %>.deleted';

  /**
   * The deleted entity data
   */
  data: {
    id: string;
    name: string;
    deletedAt: Date;
  };

  /**
   * Reason for deletion (if provided)
   */
  reason?: string;

  /**
   * Whether this is a soft or hard delete
   */
  deletionType: 'soft' | 'hard';
}

/**
 * Event payload for <%= classify(moduleName) %> status change
 */
export interface <%= classify(moduleName) %>StatusChangedEvent extends Base<%= classify(moduleName) %>Event {
  eventType: '<%= dasherize(moduleName) %>.status-changed';

  /**
   * The entity data
   */
  data: {
    id: string;
    name: string;
    previousStatus: string;
    newStatus: string;
    changedAt: Date;
  };

  /**
   * Reason for status change (if provided)
   */
  reason?: string;
}

/**
 * Custom event payload for domain-specific events
 */
export interface <%= classify(moduleName) %>CustomEvent extends Base<%= classify(moduleName) %>Event {
  eventType: string; // e.g., '<%= dasherize(moduleName) %>.custom-action'

  /**
   * Custom event data
   */
  data: Record<string, any>;

  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Helper function to create a base event structure
 */
export function createBaseEvent(
  eventType: string,
  correlationId?: string,
  triggeredBy?: string,
): Base<%= classify(moduleName) %>Event {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    timestamp: new Date(),
    version: '1.0.0',
    correlationId,
    triggeredBy,
  };
}

/**
 * Helper function to create a <%= classify(moduleName) %> created event
 */
export function create<%= classify(moduleName) %>CreatedEvent(
  entity: <%= classify(moduleName) %>Entity,
  correlationId?: string,
  triggeredBy?: string,
): <%= classify(moduleName) %>CreatedEvent {
  return {
    ...createBaseEvent('<%= dasherize(moduleName) %>.created', correlationId, triggeredBy),
    eventType: '<%= dasherize(moduleName) %>.created',
    data: {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    },
  };
}

/**
 * Helper function to create a <%= classify(moduleName) %> updated event
 */
export function create<%= classify(moduleName) %>UpdatedEvent(
  entity: <%= classify(moduleName) %>Entity,
  changedFields: string[],
  previousValues?: Record<string, any>,
  correlationId?: string,
  triggeredBy?: string,
): <%= classify(moduleName) %>UpdatedEvent {
  return {
    ...createBaseEvent('<%= dasherize(moduleName) %>.updated', correlationId, triggeredBy),
    eventType: '<%= dasherize(moduleName) %>.updated',
    data: {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      updatedAt: entity.updatedAt,
    },
    changedFields,
    previousValues,
  };
}

/**
 * Helper function to create a <%= classify(moduleName) %> deleted event
 */
export function create<%= classify(moduleName) %>DeletedEvent(
  entityId: string,
  entityName: string,
  deletionType: 'soft' | 'hard' = 'soft',
  reason?: string,
  correlationId?: string,
  triggeredBy?: string,
): <%= classify(moduleName) %>DeletedEvent {
  return {
    ...createBaseEvent('<%= dasherize(moduleName) %>.deleted', correlationId, triggeredBy),
    eventType: '<%= dasherize(moduleName) %>.deleted',
    data: {
      id: entityId,
      name: entityName,
      deletedAt: new Date(),
    },
    reason,
    deletionType,
  };
}
