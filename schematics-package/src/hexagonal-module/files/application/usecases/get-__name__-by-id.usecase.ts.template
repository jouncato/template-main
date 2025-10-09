import { Injectable, Inject, NotFoundException<% if (database !== 'none') { %>, Logger<% } %> } from '@nestjs/common';
<% if (database !== 'none') { %>import { I<%= classify(moduleName) %>Repository } from '../../domain/ports/i-<%= dasherize(moduleName) %>-repository.port';<% } %>
import { <%= classify(moduleName) %>ResponseDto } from '../dtos/<%= dasherize(moduleName) %>-response.dto';

/**
 * Use Case: Get <%= classify(moduleName) %> By ID
 *
 * This use case retrieves a single <%= classify(moduleName) %> entity by its unique identifier.
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
export class Get<%= classify(moduleName) %>ByIdUseCase {
<% if (database !== 'none') { %>  private readonly logger = new Logger(Get<%= classify(moduleName) %>ByIdUseCase.name);
<% } %>
  constructor(
<% if (database !== 'none') { %>    // Inject repository port (interface) - not the concrete adapter
    @Inject(I<%= classify(moduleName) %>Repository)
    private readonly repository: I<%= classify(moduleName) %>Repository,
<% } %>
  ) {}

  /**
   * Executes the get <%= dasherize(moduleName) %> by ID use case
   *
   * This method retrieves a specific <%= dasherize(moduleName) %> entity:
   * 1. Validates the ID format (optional)
   * 2. Queries the repository
   * 3. Handles not found case
   * 4. Transforms to response DTO
   *
   * @param id - The unique identifier of the <%= dasherize(moduleName) %>
   * @returns Promise resolving to the <%= dasherize(moduleName) %> response DTO
   * @throws {NotFoundException} If the <%= dasherize(moduleName) %> with the given ID doesn't exist
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
  async execute(id: string): Promise<<%= classify(moduleName) %>ResponseDto> {
<% if (database !== 'none') { %>    this.logger.log(`Retrieving <%= dasherize(moduleName) %> with ID: ${id}`);
<% } %>
    try {
      // TODO: Optional - Add ID format validation
      // Example: UUID validation, numeric ID validation, etc.
      // if (!this.isValidUUID(id)) {
      //   throw new BadRequestException('Invalid ID format');
      // }

<% if (database !== 'none') { %>      // Query the repository through the port interface
      const entity = await this.repository.findById(id);

      // Handle not found case
      if (!entity) {
        this.logger.warn(`<%= classify(moduleName) %> with ID ${id} not found`);
        throw new NotFoundException(
          `<%= classify(moduleName) %> with ID "${id}" not found`
        );
      }

      this.logger.log(`<%= classify(moduleName) %> retrieved successfully: ${entity.id}`);

      // Transform domain entity to response DTO
      return <%= classify(moduleName) %>ResponseDto.fromEntity(entity);
<% } else { %>      // TODO: Implement retrieval logic for in-memory or external storage
      throw new NotFoundException(`<%= classify(moduleName) %> with ID "${id}" not found`);
<% } %>
    } catch (error) {
<% if (database !== 'none') { %>      // Log the error for debugging
      this.logger.error(
        `Error retrieving <%= dasherize(moduleName) %> with ID ${id}: ${error.message}`,
        error.stack
      );
<% } %>
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
