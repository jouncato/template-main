/**
 * <%= classify(moduleName) %>Id Value Object
 *
 * Value objects are immutable and represent descriptive aspects of the domain.
 * They have no conceptual identity - two value objects with the same values are considered equal.
 *
 * This value object ensures that all <%= classify(moduleName) %> IDs follow the same format (UUID)
 * and provides type safety throughout the application.
 */

export class <%= classify(moduleName) %>Id {
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
   * Factory method to create a new <%= classify(moduleName) %>Id from a string
   * Validates that the string is a valid UUID
   */
  static create(value: string): <%= classify(moduleName) %>Id {
    return new <%= classify(moduleName) %>Id(value);
  }

  /**
   * Factory method to create a new <%= classify(moduleName) %>Id with a generated UUID
   * Note: This requires a UUID generator from infrastructure layer
   * In practice, you might inject a UUID generator service
   */
  static generate(): <%= classify(moduleName) %>Id {
    // Using crypto.randomUUID() - available in Node.js 14.17.0+
    const uuid = crypto.randomUUID();
    return new <%= classify(moduleName) %>Id(uuid);
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
      throw new Error('<%= classify(moduleName) %>Id must be a non-empty string');
    }

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4Regex.test(value)) {
      throw new Error(
        `<%= classify(moduleName) %>Id must be a valid UUID v4 format. Received: ${value}`
      );
    }
  }

  /**
   * Value objects are compared by their values, not by identity
   * Two <%= classify(moduleName) %>Id instances with the same value are considered equal
   */
  equals(other: <%= classify(moduleName) %>Id): boolean {
    if (!other) {
      return false;
    }

    if (!(other instanceof <%= classify(moduleName) %>Id)) {
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
  static fromString(value: string): <%= classify(moduleName) %>Id {
    return <%= classify(moduleName) %>Id.create(value);
  }

  /**
   * Type guard to check if a value is a valid <%= classify(moduleName) %>Id
   */
  static isValid(value: string): boolean {
    try {
      new <%= classify(moduleName) %>Id(value);
      return true;
    } catch {
      return false;
    }
  }
}
