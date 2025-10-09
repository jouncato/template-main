/**
 * PaymentsId Value Object
 *
 * Value objects are immutable and represent descriptive aspects of the domain.
 * They have no conceptual identity - two value objects with the same values are considered equal.
 *
 * This value object ensures that all Payments IDs follow the same format (UUID)
 * and provides type safety throughout the application.
 */

export class PaymentsId {
  /**
   * The actual ID value (immutable)
   * Private to ensure it cannot be modified after construction
   */
  private readonly _value: string;

  /**
   * Constructor with validation
   * Private to enforce factory method usage for better semantics
   */
  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Factory method to create a new PaymentsId from a string
   * Validates that the string is a valid UUID
   */
  static create(value: string): PaymentsId {
    return new PaymentsId(value);
  }

  /**
   * Factory method to create a new PaymentsId with a generated UUID
   * Note: This requires a UUID generator from infrastructure layer
   * In practice, you might inject a UUID generator service
   */
  static generate(): PaymentsId {
    // Using crypto.randomUUID() - available in Node.js 14.17.0+
    const uuid = crypto.randomUUID();
    return new PaymentsId(uuid);
  }

  /**
   * Get the string value of the ID
   */
  get value(): string {
    return this._value;
  }

  /**
   * Validate that the value is a valid UUID (v4 format)
   * Throws an error if validation fails
   */
  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('PaymentsId must be a non-empty string');
    }

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4Regex.test(value)) {
      throw new Error(
        `PaymentsId must be a valid UUID v4 format. Received: ${value}`
      );
    }
  }

  /**
   * Value objects are compared by their values, not by identity
   * Two PaymentsId instances with the same value are considered equal
   */
  equals(other: PaymentsId): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof PaymentsId)) {
      return false;
    }

    return this._value === other._value;
  }

  /**
   * Convert the value object to its string representation
   * Useful for serialization and logging
   */
  toString(): string {
    return this._value;
  }

  /**
   * Convert to JSON representation
   * Used when serializing to JSON
   */
  toJSON(): string {
    return this._value;
  }

  /**
   * Create a value object from a plain string (alias for create)
   * Useful in deserialization scenarios
   */
  static fromString(value: string): PaymentsId {
    return PaymentsId.create(value);
  }

  /**
   * Type guard to check if a value is a valid PaymentsId
   */
  static isValid(value: string): boolean {
    try {
      new PaymentsId(value);
      return true;
    } catch {
      return false;
    }
  }
}
