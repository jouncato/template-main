import { Injectable } from '@nestjs/common';
import { PaymentsEntity } from '../entities/payments.entity';

/**
 * Payments Domain Service
 *
 * Domain services contain business logic that doesn't naturally fit within a single entity
 * or requires coordination between multiple entities.
 *
 * When to use Domain Services:
 * - Business operations that involve multiple entities
 * - Complex business rules that don't belong to a single entity
 * - Domain calculations that require multiple value objects or entities
 * - Operations that would make an entity too complex if included
 *
 * Important principles:
 * - NO I/O operations (no database calls, no HTTP requests, no file system access)
 * - NO infrastructure concerns (those belong in application services)
 * - Pure business logic only
 * - Stateless - should not hold state between calls
 * - Can be injected using NestJS DI (exception to pure domain rule for convenience)
 */

@Injectable()
export class PaymentsDomainService {
  /**
   * Validate business rules for Payments entity
   *
   * This method encapsulates complex business rules that involve
   * multiple checks or external domain knowledge
   */
  validateBusinessRules(entity: PaymentsEntity): ValidationResult {
    const errors: string[] = [];

    // Example business rule: Name must not contain special characters
    if (!this.isValidName(entity.name)) {
      errors.push('Name must not contain special characters except spaces and hyphens');
    }

    // Example business rule: Active entities must have valid timestamps
    if (entity.isActive() && this.hasInvalidTimestamps(entity)) {
      errors.push('Active entities must have valid timestamps');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Business rule: Check if two Payments entities can be merged
   *
   * Example of a domain service method that coordinates between entities
   */
  canMerge(
    source: PaymentsEntity,
    target: PaymentsEntity,
  ): boolean {
    // Both must be active
    if (!source.isActive() || !target.isActive()) {
      return false;
    }

    // Cannot merge the same entity
    if (source.equals(target)) {
      return false;
    }

    // Add more business rules as needed
    return true;
  }

  /**
   * Business rule: Merge two Payments entities
   *
   * Returns a new entity representing the merged state
   * This is pure domain logic - the actual persistence is handled by application layer
   */
  merge(
    source: PaymentsEntity,
    target: PaymentsEntity,
  ): PaymentsEntity {
    if (!this.canMerge(source, target)) {
      throw new Error('Cannot merge these Payments entities');
    }

    // Business logic to merge entities
    // Keep target's id, merge other properties according to business rules
    return target.update({
      name: this.mergeName(source.name, target.name),
      status: target.status,
    });
  }

  /**
   * Business rule: Calculate a composite score
   *
   * Example of domain calculation that doesn't belong to a single entity
   */
  calculateScore(entity: PaymentsEntity): number {
    let score = 0;

    // Example scoring logic based on business rules
    if (entity.isActive()) {
      score += 50;
    }

    const daysSinceCreation = this.getDaysSince(entity.createdAt);
    score += Math.min(daysSinceCreation, 30); // Max 30 points for age

    const daysSinceUpdate = this.getDaysSince(entity.updatedAt);
    if (daysSinceUpdate < 7) {
      score += 20; // Bonus for recently updated
    }

    return score;
  }

  /**
   * Business rule: Determine if entity is considered "stale"
   *
   * Encapsulates the business definition of staleness
   */
  isStale(entity: PaymentsEntity): boolean {
    const daysSinceUpdate = this.getDaysSince(entity.updatedAt);
    const staleThresholdDays = 90; // Business rule: 90 days

    return daysSinceUpdate > staleThresholdDays;
  }

  /**
   * Helper method: Validate name format
   * Private because it's an implementation detail
   */
  private isValidName(name: string): boolean {
    // Business rule: Only alphanumeric, spaces, and hyphens
    const validNameRegex = /^[a-zA-Z0-9\s-]+$/;
    return validNameRegex.test(name);
  }

  /**
   * Helper method: Check for invalid timestamps
   */
  private hasInvalidTimestamps(entity: PaymentsEntity): boolean {
    const now = new Date();

    // Future timestamps are invalid
    if (entity.createdAt > now || entity.updatedAt > now) {
      return true;
    }

    // UpdatedAt before createdAt is invalid
    if (entity.updatedAt < entity.createdAt) {
      return true;
    }

    return false;
  }

  /**
   * Helper method: Merge names according to business rules
   */
  private mergeName(sourceName: string, targetName: string): string {
    // Business rule: Keep the longer name
    // In real scenarios, this might be more complex
    return sourceName.length > targetName.length ? sourceName : targetName;
  }

  /**
   * Helper method: Calculate days since a given date
   */
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

/**
 * Type for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
