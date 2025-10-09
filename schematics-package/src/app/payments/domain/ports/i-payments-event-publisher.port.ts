import { PaymentsEntity } from '../entities/payments.entity';

/**
 * Payments Event Publisher Port (Outbound Port)
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

export abstract class IPaymentsEventPublisher {
  /**
   * Publish event when a new Payments is created
   *
   * @param event - The creation event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishCreated(
    event: PaymentsCreatedEvent,
  ): Promise<void>;

  /**
   * Publish event when a Payments is updated
   *
   * @param event - The update event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishUpdated(
    event: PaymentsUpdatedEvent,
  ): Promise<void>;

  /**
   * Publish event when a Payments is deleted
   *
   * @param event - The deletion event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishDeleted(
    event: PaymentsDeletedEvent,
  ): Promise<void>;

  /**
   * Publish event when a Payments status changes
   *
   * @param event - The status change event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishStatusChanged(
    event: PaymentsStatusChangedEvent,
  ): Promise<void>;

  /**
   * Publish a custom domain event
   *
   * @param event - The custom event payload
   * @returns Promise that resolves when event is published
   */
  abstract publishCustomEvent(
    event: PaymentsCustomEvent,
  ): Promise<void>;
}

/**
 * Base interface for all Payments events
 */
export interface BasePaymentsEvent {
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
 * Event payload for Payments creation
 */
export interface PaymentsCreatedEvent extends BasePaymentsEvent {
  eventType: 'payments.created';

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
 * Event payload for Payments update
 */
export interface PaymentsUpdatedEvent extends BasePaymentsEvent {
  eventType: 'payments.updated';

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
 * Event payload for Payments deletion
 */
export interface PaymentsDeletedEvent extends BasePaymentsEvent {
  eventType: 'payments.deleted';

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
 * Event payload for Payments status change
 */
export interface PaymentsStatusChangedEvent extends BasePaymentsEvent {
  eventType: 'payments.status-changed';

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
export interface PaymentsCustomEvent extends BasePaymentsEvent {
  eventType: string; // e.g., 'payments.custom-action'

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
): BasePaymentsEvent {
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
 * Helper function to create a Payments created event
 */
export function createPaymentsCreatedEvent(
  entity: PaymentsEntity,
  correlationId?: string,
  triggeredBy?: string,
): PaymentsCreatedEvent {
  return {
    ...createBaseEvent('payments.created', correlationId, triggeredBy),
    eventType: 'payments.created',
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
 * Helper function to create a Payments updated event
 */
export function createPaymentsUpdatedEvent(
  entity: PaymentsEntity,
  changedFields: string[],
  previousValues?: Record<string, any>,
  correlationId?: string,
  triggeredBy?: string,
): PaymentsUpdatedEvent {
  return {
    ...createBaseEvent('payments.updated', correlationId, triggeredBy),
    eventType: 'payments.updated',
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
 * Helper function to create a Payments deleted event
 */
export function createPaymentsDeletedEvent(
  entityId: string,
  entityName: string,
  deletionType: 'soft' | 'hard' = 'soft',
  reason?: string,
  correlationId?: string,
  triggeredBy?: string,
): PaymentsDeletedEvent {
  return {
    ...createBaseEvent('payments.deleted', correlationId, triggeredBy),
    eventType: 'payments.deleted',
    data: {
      id: entityId,
      name: entityName,
      deletedAt: new Date(),
    },
    reason,
    deletionType,
  };
}
