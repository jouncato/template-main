import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { IPaymentsRepository } from '../../domain/ports/i-payments-repository.port';
import { IPaymentsEventPublisher } from '../../domain/ports/i-payments-event-publisher.port';
import { PaymentsDomainService } from '../../domain/services/payments-domain.service';

/**
 * Use Case: Delete Payments
 *
 * This use case orchestrates the deletion of an existing Payments entity.
 * It supports both soft delete (marking as inactive) and hard delete (permanent removal)
 * strategies, following hexagonal architecture principles.
 *
 * Responsibilities:
 * 1. Verify the entity exists
 * 2. Validate deletion is allowed by business rules
 * 3. Perform soft or hard delete
 * 4. Publish domain events for eventual consistency
 * 5. Return confirmation
 *
 * Flow:
 * Controller -> UseCase -> Domain Service -> Repository & Event Publisher
 *
 * Deletion Strategies:
 * - Soft Delete: Sets isActive = false, preserves data for audit/recovery
 * - Hard Delete: Permanently removes from database (use with caution)
 *
 * Choose soft delete when:
 * - Audit trails are required
 * - Data recovery might be needed
 * - Referential integrity must be maintained
 *
 * Choose hard delete when:
 * - Data must be purged for compliance (GDPR, etc.)
 * - Storage optimization is critical
 * - Entity has no dependencies
 *
 * @example
 * ```typescript
 * await deleteUseCase.execute('entity-id');
 * // Or with options:
 * await deleteUseCase.execute('entity-id', { hardDelete: true });
 * ```
 */
@Injectable()
export class DeletePaymentsUseCase {
  private readonly logger = new Logger(DeletePaymentsUseCase.name);

  constructor(
    // Inject repository port (interface) - not the concrete adapter
    @Inject(IPaymentsRepository)
    private readonly repository: IPaymentsRepository,

    // Inject domain service for business logic validation
    private readonly domainService: PaymentsDomainService,

    // Inject event publisher port (interface) - not the concrete adapter
    @Inject(IPaymentsEventPublisher)
    private readonly eventPublisher: IPaymentsEventPublisher,

  ) {}

  /**
   * Executes the delete payments use case
   *
   * This method orchestrates the deletion process:
   * 1. Verifies the entity exists
   * 2. Validates deletion is allowed
   * 3. Performs soft or hard delete
   * 4. Publishes a deletion event
   * 5. Returns success confirmation
   *
   * @param id - The unique identifier of the payments to delete
   * @param options - Optional configuration for deletion behavior
   * @param options.hardDelete - If true, performs hard delete; otherwise soft delete (default: false)
   * @returns Promise resolving to void on successful deletion
   * @throws {NotFoundException} If the entity doesn't exist
   * @throws {BadRequestException} If deletion violates business rules
   * @throws {ConflictException} If the entity has dependencies
   *
   * @example
   * ```typescript
   * // Soft delete (default)
   * await useCase.execute('550e8400-e29b-41d4-a716-446655440000');
   *
   * // Hard delete
   * await useCase.execute('550e8400-e29b-41d4-a716-446655440000', { hardDelete: true });
   * ```
   */
  async execute(
    id: string,
    options?: { hardDelete?: boolean }
  ): Promise<void> {
    const hardDelete = options?.hardDelete ?? false;
    this.logger.log(
      `Deleting payments with ID: ${id} (${hardDelete ? 'hard' : 'soft'} delete)`
    );

    try {
      // Step 1: Verify the entity exists
      const existingEntity = await this.repository.findById(id);

      if (!existingEntity) {
        this.logger.warn(`Payments with ID ${id} not found for deletion`);
        throw new NotFoundException(
          `Payments with ID "${id}" not found`
        );
      }

      // Step 2: Validate deletion is allowed by business rules
      // The domain service can check for dependencies, prevent deletion of protected entities, etc.
      await this.domainService.validateForDeletion(existingEntity);

      // Step 3: Perform the appropriate type of deletion
      if (hardDelete) {
        // Hard delete: Permanently remove from database
        await this.repository.hardDelete(id);
        this.logger.log(`Payments hard deleted successfully: ${id}`);
      } else {
        // Soft delete: Mark as inactive but keep the data
        existingEntity.isActive = false;
        existingEntity.updatedAt = new Date();
        // Optional: Add deletedAt timestamp
        // existingEntity.deletedAt = new Date();

        await this.repository.update(id, existingEntity);
        this.logger.log(`Payments soft deleted successfully: ${id}`);
      }

      // Step 4: Publish domain event for eventual consistency
      // Other bounded contexts can react to this deletion
      // For example, clean up related data, update caches, send notifications
      await this.eventPublisher.publishPaymentsDeletedEvent({
        id: id,
        deletionType: hardDelete ? 'hard' : 'soft',
        occurredAt: new Date(),
        // TODO: Add additional event payload data
        // Consider including reason for deletion, who initiated it, etc.
      });

      // Step 5: Success - no return value needed for delete operations
      this.logger.log(`Payments deletion completed successfully: ${id}`);

    } catch (error) {
      this.logger.error(
        `Failed to delete payments with ID ${id}: ${error.message}`,
        error.stack
      );

      // Re-throw domain exceptions (NotFoundException, BadRequestException, etc.)
      throw error;
    }
  }

  /**
   * Alternative method for bulk deletion
   * Uncomment and implement if bulk operations are needed
   *
   * @param ids - Array of entity IDs to delete
   * @param options - Deletion options
   * @returns Promise resolving to the number of entities deleted
   */
  // async executeMany(
  //   ids: string[],
  //   options?: { hardDelete?: boolean }
  // ): Promise<number> {
  //   this.logger.log(`Bulk deleting ${ids.length} paymentss`);
  //
  //   let deletedCount = 0;
  //
  //   for (const id of ids) {
  //     try {
  //       await this.execute(id, options);
  //       deletedCount++;
  //     } catch (error) {
  //       this.logger.warn(`Failed to delete payments ${id}: ${error.message}`);
  //       // Continue with remaining deletions or throw based on your strategy
  //     }
  //   }
  //
  //   this.logger.log(`Bulk deletion completed: ${deletedCount}/${ids.length} successful`);
  //   return deletedCount;
  // }
}
