import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { IPaymentsRepository } from '../../domain/ports/i-payments-repository.port';
import { IPaymentsEventPublisher } from '../../domain/ports/i-payments-event-publisher.port';
import { PaymentsDomainService } from '../../domain/services/payments-domain.service';
import { UpdatePaymentsDto } from '../dtos/update-payments.dto';
import { PaymentsResponseDto } from '../dtos/payments-response.dto';

/**
 * Use Case: Update Payments
 *
 * This use case orchestrates the update of an existing Payments entity.
 * It demonstrates how to handle modifications while maintaining domain integrity
 * in the hexagonal architecture pattern.
 *
 * Responsibilities:
 * 1. Retrieve the existing entity
 * 2. Validate business rules for the update
 * 3. Apply changes to the domain entity
 * 4. Persist via repository port
 * 5. Publish domain events for eventual consistency
 * 6. Return updated response DTO
 *
 * Flow:
 * Controller -> UseCase -> Domain Service -> Repository & Event Publisher
 *
 * Update Strategy:
 * - Partial updates (PATCH semantics) - only provided fields are updated
 * - Domain validations are applied before persisting
 * - Events are published after successful update
 *
 * @example
 * ```typescript
 * const dto = new UpdatePaymentsDto();
 * dto.name = 'Updated Name';
 * dto.isActive = false;
 * const result = await updateUseCase.execute('entity-id', dto);
 * ```
 */
@Injectable()
export class UpdatePaymentsUseCase {
  private readonly logger = new Logger(UpdatePaymentsUseCase.name);

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
   * Executes the update payments use case
   *
   * This method orchestrates the entire update process:
   * 1. Retrieves the existing entity
   * 2. Validates the update against business rules
   * 3. Applies changes to the entity
   * 4. Persists the updated entity
   * 5. Publishes an update event
   * 6. Returns the response DTO
   *
   * @param id - The unique identifier of the payments to update
   * @param dto - The data transfer object containing update data
   * @returns Promise resolving to the updated payments as a response DTO
   * @throws {NotFoundException} If the entity doesn't exist
   * @throws {BadRequestException} If business rules are violated
   * @throws {ConflictException} If the update creates a conflict
   *
   * @example
   * ```typescript
   * const dto = new UpdatePaymentsDto();
   * dto.name = 'New Name';
   * const response = await useCase.execute('550e8400-e29b-41d4-a716-446655440000', dto);
   * console.log(response.updatedAt); // New timestamp
   * ```
   */
  async execute(id: string, dto: UpdatePaymentsDto): Promise<PaymentsResponseDto> {
    this.logger.log(`Updating payments with ID: ${id}`);

    try {
      // Step 1: Retrieve the existing entity
      const existingEntity = await this.repository.findById(id);

      if (!existingEntity) {
        this.logger.warn(`Payments with ID ${id} not found for update`);
        throw new NotFoundException(
          `Payments with ID "${id}" not found`
        );
      }

      // Step 2: Validate the update against business rules
      // The domain service ensures that the update doesn't violate domain invariants
      await this.domainService.validateForUpdate(existingEntity, dto);

      // Step 3: Apply changes to the domain entity
      // Only update fields that are provided in the DTO (partial update)
      if (dto.name !== undefined) {
        existingEntity.name = dto.name;
      }

      if (dto.description !== undefined) {
        existingEntity.description = dto.description;
      }

      if (dto.isActive !== undefined) {
        existingEntity.isActive = dto.isActive;
      }

      // TODO: Update additional properties from your DTO
      // Always use !== undefined to allow explicitly setting values to null/false

      // Update the timestamp
      existingEntity.updatedAt = new Date();

      // Step 4: Persist the updated entity through the repository port
      const updatedEntity = await this.repository.update(id, existingEntity);

      this.logger.log(`Payments updated successfully: ${updatedEntity.id}`);

      // Step 5: Publish domain event for eventual consistency
      // Other bounded contexts can react to this update
      await this.eventPublisher.publishPaymentsUpdatedEvent({
        id: updatedEntity.id,
        changes: dto,
        occurredAt: new Date(),
        // TODO: Add additional event payload data
        // Consider including what changed, previous values, etc.
      });

      // Step 6: Transform domain entity to response DTO
      return PaymentsResponseDto.fromEntity(updatedEntity);
    } catch (error) {
      this.logger.error(
        `Failed to update payments with ID ${id}: ${error.message}`,
        error.stack
      );

      // Re-throw domain exceptions (NotFoundException, BadRequestException, etc.)
      throw error;
    }
  }
}
