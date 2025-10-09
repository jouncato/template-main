import { PaymentsEntity } from '../entities/payments.entity';

/**
 * Payments Repository Port (Outbound Port)
 *
 * This is a PORT in hexagonal architecture - it defines the interface
 * that the domain expects for persistence operations.
 *
 * Key principles:
 * - This is an OUTBOUND port (domain -> infrastructure)
 * - The domain layer defines this interface
 * - The infrastructure layer implements this interface (adapter)
 * - The domain layer depends on this abstraction, NOT on concrete implementations
 * - This enables dependency inversion and makes the domain independent of infrastructure
 *
 * Implementation location:
 * - This interface lives in: domain/ports/
 * - The concrete implementation lives in: infrastructure/persistence/repositories/
 *
 * Benefits:
 * - Domain layer is completely isolated from database concerns
 * - Can swap database implementations without changing domain code
 * - Easy to test domain logic with mock implementations
 * - Clear separation of concerns
 */

export abstract class IPaymentsRepository {
  /**
   * Find a Payments entity by its unique identifier
   *
   * @param id - The unique identifier of the Payments
   * @returns Promise resolving to the entity if found, null otherwise
   */
  abstract findById(id: string): Promise<PaymentsEntity | null>;

  /**
   * Find all Payments entities
   *
   * @returns Promise resolving to an array of all entities
   */
  abstract findAll(): Promise<PaymentsEntity[]>;

  /**
   * Find Payments entities by status
   *
   * @param status - The status to filter by
   * @returns Promise resolving to an array of matching entities
   */
  abstract findByStatus(status: string): Promise<PaymentsEntity[]>;

  /**
   * Find a Payments entity by name
   *
   * @param name - The name to search for
   * @returns Promise resolving to the entity if found, null otherwise
   */
  abstract findByName(name: string): Promise<PaymentsEntity | null>;

  /**
   * Save a new Payments entity
   *
   * @param entity - The entity to save
   * @returns Promise resolving to the saved entity (may include generated fields)
   * @throws Error if entity with same id already exists
   */
  abstract save(entity: PaymentsEntity): Promise<PaymentsEntity>;

  /**
   * Update an existing Payments entity
   *
   * @param entity - The entity to update
   * @returns Promise resolving to the updated entity
   * @throws Error if entity does not exist
   */
  abstract update(entity: PaymentsEntity): Promise<PaymentsEntity>;

  /**
   * Delete a Payments entity by its identifier
   *
   * @param id - The unique identifier of the entity to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Check if a Payments entity exists by id
   *
   * @param id - The unique identifier to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  abstract exists(id: string): Promise<boolean>;

  /**
   * Count total number of Payments entities
   *
   * @returns Promise resolving to the count
   */
  abstract count(): Promise<number>;

  /**
   * Find Payments entities with pagination
   *
   * @param options - Pagination options (page, limit, sort)
   * @returns Promise resolving to paginated results
   */
  abstract findWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<PaymentsEntity>>;

  /**
   * Save multiple Payments entities in a single transaction
   *
   * @param entities - Array of entities to save
   * @returns Promise resolving to array of saved entities
   */
  abstract saveMany(entities: PaymentsEntity[]): Promise<PaymentsEntity[]>;

  /**
   * Delete multiple Payments entities by their identifiers
   *
   * @param ids - Array of unique identifiers
   * @returns Promise resolving to the number of deleted entities
   */
  abstract deleteMany(ids: string[]): Promise<number>;
}

/**
 * Pagination options for query operations
 */
export interface PaginationOptions {
  /**
   * Page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Sort field and direction
   */
  sort?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };

  /**
   * Optional filter criteria
   */
  filter?: Record<string, any>;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /**
   * Array of items for current page
   */
  items: T[];

  /**
   * Current page number
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there is a next page
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page
   */
  hasPrevious: boolean;
}
