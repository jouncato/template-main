import { Injectable, Inject, Logger } from '@nestjs/common';
import { IPaymentsRepository } from '../../domain/ports/i-payments-repository.port';
import { IPaymentsEventPublisher } from '../../domain/ports/i-payments-event-publisher.port';
import { PaymentsDomainService } from '../../domain/services/payments-domain.service';
import { PaymentsEntity } from '../../domain/entities/payments.entity';
import { CreatePaymentsDto } from '../dtos/create-payments.dto';
import { PaymentsResponseDto } from '../dtos/payments-response.dto';

/**
 * Use Case: Create Payments
 *
 * This use case orchestrates the creation of a new Payments entity.
 * It follows the hexagonal architecture pattern by depending on port interfaces
 * rather than concrete implementations.
 *
 * Responsibilities:
 * 1. Validate business rules through domain service
 * 2. Create the domain entity
 * 3. Persist via repository port
 * 4. Publish domain events via event publisher port
 * 5. Return response DTO to the caller
 *
 * Flow:
 * Controller -> UseCase -> Domain Service -> Repository & Event Publisher
 *
 * Dependencies are injected using NestJS DI with interface tokens,
 * allowing adapters to be swapped without changing this use case.
 *
 * @example
 * ```typescript
 * const dto = new CreatePaymentsDto();
 * dto.name = 'Example';
 * const result = await createUseCase.execute(dto);
 * ```
 */
@Injectable()
export class CreatePaymentsUseCase {
  private readonly logger = new Logger(CreatePaymentsUseCase.name);

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
   * Executes the create payments use case
   *
   * This method orchestrates the entire creation process:
   * 1. Validates the input DTO (already validated by class-validator)
   * 2. Applies domain business rules
   * 3. Creates the domain entity
   * 4. Persists the entity
   * 5. Publishes a domain event
   * 6. Returns the response DTO
   *
   * @param dto - The data transfer object containing creation data
   * @returns Promise resolving to the created payments as a response DTO
   * @throws {BadRequestException} If business rules are violated
   * @throws {ConflictException} If a duplicate entity exists
   * @throws {InternalServerErrorException} If persistence fails
   *
   * @example
   * ```typescript
   * const dto = new CreatePaymentsDto();
   * dto.name = 'Example';
   * dto.description = 'Test description';
   * const response = await useCase.execute(dto);
   * console.log(response.id); // UUID of created entity
   * ```
   */
  async execute(dto: CreatePaymentsDto): Promise<PaymentsResponseDto> {
    this.logger.log(`Creating new payments: ${dto.name}`);

    try {
      // Step 1: Apply domain business rules and validations
      // The domain service contains pure business logic
      await this.domainService.validateForCreation(dto);

      // Step 2: Create the domain entity
      // The entity encapsulates domain logic and invariants
      const entity = PaymentsEntity.create({
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        // TODO: Add additional properties from your DTO
      });

      // Step 3: Persist the entity through the repository port
      // The actual storage mechanism is abstracted by the port interface
      const savedEntity = await this.repository.save(entity);

      this.logger.log(`Payments created successfully with ID: ${savedEntity.id}`);

      // Step 4: Publish domain event for eventual consistency
      // Other bounded contexts can react to this event
      await this.eventPublisher.publishPaymentsCreatedEvent({
        id: savedEntity.id,
        name: savedEntity.name,
        occurredAt: new Date(),
        // TODO: Add additional event payload data
      });

      // Step 5: Transform domain entity to response DTO
      // This provides a clean separation between domain and API layers
      return PaymentsResponseDto.fromEntity(savedEntity);
    } catch (error) {
      this.logger.error(`Failed to create payments: ${error.message}`, error.stack);

      // Re-throw domain exceptions (BadRequestException, ConflictException, etc.)
      // These will be handled by NestJS exception filters
      throw error;
    }
  }
}
