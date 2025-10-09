import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { IPaymentsRepository } from '../../domain/ports/i-payments-repository.port';
import { PaymentsResponseDto } from '../dtos/payments-response.dto';

/**
 * Use Case: Get Payments By ID
 *
 * This use case retrieves a single Payments entity by its unique identifier.
 * It demonstrates query operations in the hexagonal architecture pattern.
 *
 * Responsibilities:
 * 1. Validate the ID format (if needed)
 * 2. Retrieve entity via repository port
 * 3. Handle not found scenarios
 * 4. Transform entity to response DTO
 * 5. Return result to caller
 *
 * Flow:
 * Controller -> UseCase -> Repository -> Database
 *
 * Error Handling:
 * - Throws NotFoundException if entity doesn't exist
 * - Logs errors for debugging and monitoring
 *
 * @example
 * ```typescript
 * const result = await getByIdUseCase.execute('550e8400-e29b-41d4-a716-446655440000');
 * console.log(result.name);
 * ```
 */
@Injectable()
export class GetPaymentsByIdUseCase {
  private readonly logger = new Logger(GetPaymentsByIdUseCase.name);

  constructor(
    // Inject repository port (interface) - not the concrete adapter
    @Inject(IPaymentsRepository)
    private readonly repository: IPaymentsRepository,

  ) {}

  /**
   * Executes the get payments by ID use case
   *
   * This method retrieves a specific payments entity:
   * 1. Validates the ID format (optional)
   * 2. Queries the repository
   * 3. Handles not found case
   * 4. Transforms to response DTO
   *
   * @param id - The unique identifier of the payments
   * @returns Promise resolving to the payments response DTO
   * @throws {NotFoundException} If the payments with the given ID doesn't exist
   * @throws {BadRequestException} If the ID format is invalid
   *
   * @example
   * ```typescript
   * try {
   *   const response = await useCase.execute('550e8400-e29b-41d4-a716-446655440000');
   *   console.log(response.name);
   * } catch (error) {
   *   if (error instanceof NotFoundException) {
   *     console.error('Entity not found');
   *   }
   * }
   * ```
   */
  async execute(id: string): Promise<PaymentsResponseDto> {
    this.logger.log(`Retrieving payments with ID: ${id}`);

    try {
      // TODO: Optional - Add ID format validation
      // Example: UUID validation, numeric ID validation, etc.
      // if (!this.isValidUUID(id)) {
      //   throw new BadRequestException('Invalid ID format');
      // }

      // Query the repository through the port interface
      const entity = await this.repository.findById(id);

      // Handle not found case
      if (!entity) {
        this.logger.warn(`Payments with ID ${id} not found`);
        throw new NotFoundException(
          `Payments with ID "${id}" not found`
        );
      }

      this.logger.log(`Payments retrieved successfully: ${entity.id}`);

      // Transform domain entity to response DTO
      return PaymentsResponseDto.fromEntity(entity);

    } catch (error) {
      // Log the error for debugging
      this.logger.error(
        `Error retrieving payments with ID ${id}: ${error.message}`,
        error.stack
      );

      // Re-throw the exception to be handled by NestJS exception filters
      throw error;
    }
  }

  /**
   * Helper method to validate UUID format (optional)
   * Uncomment and use if your IDs are UUIDs
   *
   * @param id - The ID to validate
   * @returns true if valid UUID, false otherwise
   */
  // private isValidUUID(id: string): boolean {
  //   const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  //   return uuidRegex.test(id);
  // }
}
