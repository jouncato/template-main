/**
 * Payments Entity
 *
 * This is a pure domain entity following hexagonal architecture principles.
 * - Immutable: All properties are readonly
 * - Pure TypeScript: No external framework dependencies (except NestJS DI where needed)
 * - Business Logic: Contains domain validation and business rules
 * - Framework-agnostic: Can be used in any context without coupling to infrastructure
 */

export class PaymentsEntity {
  /**
   * Unique identifier for the payments
   */
  readonly id: string;

  /**
   * Timestamp when the entity was created
   */
  readonly createdAt: Date;

  /**
   * Timestamp when the entity was last updated
   */
  readonly updatedAt: Date;

  /**
   * Example domain property - replace or extend with actual business properties
   */
  readonly name: string;

  /**
   * Example domain property - replace or extend with actual business properties
   */
  readonly status: string;

  /**
   * Private constructor to enforce factory method usage
   * Ensures all instances are created with valid state
   */
  private constructor(props: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    // Validate entity state on construction
    this.validate();
  }

  /**
   * Factory method to create a new Payments entity
   * Use this for creating new entities with generated timestamps
   */
  static create(props: {
    id: string;
    name: string;
    status?: string;
  }): PaymentsEntity {
    const now = new Date();

    return new PaymentsEntity({
      id: props.id,
      name: props.name,
      status: props.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method to reconstitute an entity from persistence
   * Use this when loading entities from database
   */
  static reconstitute(props: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentsEntity {
    return new PaymentsEntity(props);
  }

  /**
   * Creates a new instance with updated properties
   * Maintains immutability by returning a new instance
   */
  update(props: Partial<{
    name: string;
    status: string;
  }>): PaymentsEntity {
    return new PaymentsEntity({
      id: this.id,
      name: props.name ?? this.name,
      status: props.status ?? this.status,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Domain validation method
   * Throws error if entity state is invalid
   */
  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Payments entity must have a valid id');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Payments entity must have a valid name');
    }

    if (this.name.length > 255) {
      throw new Error('Payments name must not exceed 255 characters');
    }

    if (!this.createdAt) {
      throw new Error('Payments entity must have a createdAt timestamp');
    }

    if (!this.updatedAt) {
      throw new Error('Payments entity must have an updatedAt timestamp');
    }

    if (this.updatedAt < this.createdAt) {
      throw new Error('Payments updatedAt cannot be before createdAt');
    }
  }

  /**
   * Business validation: Check if entity is active
   */
  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Business rule: Validate if entity can be deleted
   */
  canBeDeleted(): boolean {
    // Add your business rules here
    return this.status !== 'DELETED';
  }

  /**
   * Business rule: Activate the entity
   */
  activate(): PaymentsEntity {
    if (this.status === 'ACTIVE') {
      throw new Error('Payments is already active');
    }

    return this.update({ status: 'ACTIVE' });
  }

  /**
   * Business rule: Deactivate the entity
   */
  deactivate(): PaymentsEntity {
    if (this.status === 'INACTIVE') {
      throw new Error('Payments is already inactive');
    }

    return this.update({ status: 'INACTIVE' });
  }

  /**
   * Equality comparison based on entity identity (id)
   */
  equals(other: PaymentsEntity): boolean {
    if (!other) {
      return false;
    }

    return this.id === other.id;
  }

  /**
   * Convert entity to plain object for serialization
   * Useful for logging or debugging
   */
  toObject(): {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
