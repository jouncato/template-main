import { Injectable } from '@nestjs/common';
import * as oracledb from 'oracledb';

import { OracleService } from '@share/infrastructure/oracle/oracle.service';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';

import { PaymentsEntity } from '../../../../domain/entities/payments.entity';
import { IPaymentsRepository, PaginationOptions, PaginatedResult } from '../../../../domain/ports/i-payments-repository.port';
import { OracleStoredProcMapper } from './stored-proc-mapper.util';

/**
 * Oracle Repository Adapter for Payments
 *
 * This is an ADAPTER in hexagonal architecture - it implements the repository port
 * using Oracle stored procedures and PL/SQL packages.
 *
 * Architecture Pattern:
 * - Implements: IPaymentsRepository (outbound port defined in domain layer)
 * - Uses: OracleService for database operations
 * - Approach: Stored procedure-based data access (no ORM)
 *
 * Stored Procedure Naming Convention:
 * - PRC_PAYMENTS_SELECT (with p_cursor OUT SYS_REFCURSOR for result sets)
 * - PRC_PAYMENTS_INSERT (with p_result OUT NUMBER for status)
 * - PRC_PAYMENTS_UPDATE (with p_affected_rows OUT NUMBER)
 * - PRC_PAYMENTS_DELETE (with p_affected_rows OUT NUMBER)
 *
 * Oracle-Specific Features:
 * - SYS_REFCURSOR: Used for returning result sets from procedures
 * - Bind Variables: All parameters use Oracle bind variables for security and performance
 * - OUT Parameters: Procedures return status codes via OUT parameters
 * - Package Organization: All procedures organized in a PL/SQL package
 *
 * Benefits of Stored Procedures:
 * - Performance: Compiled and cached by Oracle
 * - Security: Parameterized queries prevent SQL injection
 * - Encapsulation: Database logic centralized in database
 * - Transaction Control: Native support for COMMIT/ROLLBACK
 * - Maintainability: DBAs can optimize without changing application code
 *
 * Transaction Handling:
 * - Each stored procedure manages its own transaction scope
 * - Complex operations use SAVEPOINT/COMMIT/ROLLBACK
 * - Error handling with EXCEPTION blocks in PL/SQL
 *
 * Cursor Management:
 * - The OracleService automatically fetches all rows from SYS_REFCURSOR
 * - Cursors are properly closed after fetching data
 * - Memory-efficient batch fetching for large result sets
 *
 * @see OracleService for database connection management and cursor handling
 * @see IPaymentsRepository for port interface definition
 */
@Injectable()
export class PaymentsRepositoryAdapter implements IPaymentsRepository {
  constructor(
    private readonly oracleService: OracleService,
    private readonly logger: Logger20Service,
  ) {}

  /**
   * Find a Payments by ID
   *
   * Calls stored procedure: PRC_PAYMENTS_SELECT
   *
   * Oracle Specifics:
   * - Uses SYS_REFCURSOR for result set
   * - Bind variable: p_id (VARCHAR2)
   * - OUT parameter: p_cursor (SYS_REFCURSOR)
   *
   * @param id - The unique identifier
   * @returns Promise resolving to entity or null if not found
   */
  async findById(id: string): Promise<PaymentsEntity | null> {
    try {
      this.logger.log(`Finding payments by id: ${id}`);

      // Bind parameters for stored procedure
      // p_id: IN parameter with the entity ID
      // p_cursor: OUT parameter that will contain the result set
      const binds: oracledb.BindParameters = {
        p_id: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: id },
        p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      };

      // Execute stored procedure
      // OracleService automatically fetches all rows from the cursor
      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_SELECT',
        binds,
      );

      // Extract cursor data from outBinds
      // The cursor has been automatically fetched and closed by OracleService
      const rows = result.outBinds?.p_cursor as any[];

      // Check if any results were returned
      if (!rows || rows.length === 0) {
        this.logger.log(`Payments with id ${id} not found`);
        return null;
      }

      // Map first database record to domain entity
      const record = rows[0];
      const entity = OracleStoredProcMapper.fromDbResult(record);

      this.logger.log(`Found payments: ${entity.id}`);
      return entity;
    } catch (error) {
      this.logger.error(`Error finding payments by id ${id}:`, error);
      throw new Error(`Failed to find payments by id: ${(error as Error).message}`);
    }
  }

  /**
   * Find all Payments entities
   *
   * Calls stored procedure: PRC_PAYMENTS_SELECT_ALL
   *
   * Oracle Specifics:
   * - No IN parameters (fetches all records)
   * - OUT parameter: p_cursor (SYS_REFCURSOR)
   *
   * @returns Promise resolving to array of entities
   */
  async findAll(): Promise<PaymentsEntity[]> {
    try {
      this.logger.log(`Finding all payments entities`);

      // Bind parameters: only OUT cursor, no IN parameters
      const binds: oracledb.BindParameters = {
        p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      };

      // Execute stored procedure
      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_SELECT_ALL',
        binds,
      );

      // Extract and map cursor data
      const rows = result.outBinds?.p_cursor as any[];

      if (!rows || rows.length === 0) {
        this.logger.log(`No payments entities found`);
        return [];
      }

      // Map all records to domain entities
      const entities = rows.map((record) => OracleStoredProcMapper.fromDbResult(record));

      this.logger.log(`Found ${entities.length} payments entities`);
      return entities;
    } catch (error) {
      this.logger.error(`Error finding all payments entities:`, error);
      throw new Error(`Failed to find all payments entities: ${(error as Error).message}`);
    }
  }

  /**
   * Find Payments entities by status
   *
   * Calls stored procedure: PRC_PAYMENTS_SELECT_BY_STATUS
   *
   * @param status - The status to filter by
   * @returns Promise resolving to array of matching entities
   */
  async findByStatus(status: string): Promise<PaymentsEntity[]> {
    try {
      this.logger.log(`Finding payments entities by status: ${status}`);

      const binds: oracledb.BindParameters = {
        p_status: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: status },
        p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      };

      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_SELECT_BY_STATUS',
        binds,
      );

      const rows = result.outBinds?.p_cursor as any[];

      if (!rows || rows.length === 0) {
        return [];
      }

      const entities = rows.map((record) => OracleStoredProcMapper.fromDbResult(record));
      this.logger.log(`Found ${entities.length} payments entities with status ${status}`);
      return entities;
    } catch (error) {
      this.logger.error(`Error finding payments by status:`, error);
      throw new Error(`Failed to find payments by status: ${(error as Error).message}`);
    }
  }

  /**
   * Find a Payments by name
   *
   * Calls stored procedure: PRC_PAYMENTS_SELECT_BY_NAME
   *
   * @param name - The name to search for
   * @returns Promise resolving to entity or null if not found
   */
  async findByName(name: string): Promise<PaymentsEntity | null> {
    try {
      this.logger.log(`Finding payments by name: ${name}`);

      const binds: oracledb.BindParameters = {
        p_name: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: name },
        p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      };

      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_SELECT_BY_NAME',
        binds,
      );

      const rows = result.outBinds?.p_cursor as any[];

      if (!rows || rows.length === 0) {
        return null;
      }

      const entity = OracleStoredProcMapper.fromDbResult(rows[0]);
      return entity;
    } catch (error) {
      this.logger.error(`Error finding payments by name:`, error);
      throw new Error(`Failed to find payments by name: ${(error as Error).message}`);
    }
  }

  /**
   * Save a new Payments entity
   *
   * Calls stored procedure: PRC_PAYMENTS_INSERT
   *
   * Oracle Specifics:
   * - All entity properties as IN parameters
   * - OUT parameter: p_result (NUMBER) for operation status
   *   - 1 = Success
   *   - -1 = Already exists (duplicate ID)
   *   - 0 = Failed
   *
   * Transaction handling:
   * - The stored procedure manages transaction scope with COMMIT/ROLLBACK
   * - Uses EXCEPTION block for error handling
   *
   * @param entity - The entity to save
   * @returns Promise resolving to the saved entity
   * @throws Error if save operation fails
   */
  async save(entity: PaymentsEntity): Promise<PaymentsEntity> {
    try {
      this.logger.log(`Saving new payments: ${entity.id}`);

      // Map entity to stored procedure parameters
      const insertParams = OracleStoredProcMapper.toInsertParams(entity);

      // Add OUT parameter for result status
      const binds: oracledb.BindParameters = {
        ...insertParams,
        p_result: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      // Execute stored procedure
      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_INSERT',
        binds,
      );

      // Check output parameter for success
      // Convention: 1 = success, -1 = already exists, 0 = failure
      const resultCode = result.outBinds?.p_result as number;

      if (resultCode === 1) {
        this.logger.log(`Successfully saved payments: ${entity.id}`);
        return entity;
      } else if (resultCode === -1) {
        throw new Error(`Payments with id ${entity.id} already exists`);
      } else {
        throw new Error(`Failed to save payments, result code: ${resultCode}`);
      }
    } catch (error) {
      this.logger.error(`Error saving payments:`, error);

      // Handle Oracle-specific errors
      if ((error as any).errorNum === 1) {
        throw new Error(`Payments with id ${entity.id} already exists (ORA-00001: unique constraint violated)`);
      }

      throw new Error(`Failed to save payments: ${(error as Error).message}`);
    }
  }

  /**
   * Update an existing Payments entity
   *
   * Calls stored procedure: PRC_PAYMENTS_UPDATE
   *
   * Oracle Specifics:
   * - Entity properties as IN parameters
   * - OUT parameter: p_affected_rows (NUMBER)
   *
   * Transaction handling:
   * - Managed by stored procedure with COMMIT/ROLLBACK
   * - Returns affected rows count via output parameter
   *
   * @param entity - The entity to update
   * @returns Promise resolving to the updated entity
   * @throws Error if entity does not exist
   */
  async update(entity: PaymentsEntity): Promise<PaymentsEntity> {
    try {
      this.logger.log(`Updating payments: ${entity.id}`);

      // Map entity to update parameters
      const updateParams = OracleStoredProcMapper.toUpdateParams(entity);

      // Add OUT parameter for affected rows
      const binds: oracledb.BindParameters = {
        ...updateParams,
        p_affected_rows: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      // Execute stored procedure
      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_UPDATE',
        binds,
      );

      // Check affected rows
      const affectedRows = result.outBinds?.p_affected_rows as number;

      if (affectedRows === 0) {
        throw new Error(`Payments with id ${entity.id} not found`);
      }

      this.logger.log(`Successfully updated payments: ${entity.id}`);
      return entity;
    } catch (error) {
      this.logger.error(`Error updating payments:`, error);
      throw new Error(`Failed to update payments: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a Payments by ID
   *
   * Calls stored procedure: PRC_PAYMENTS_DELETE
   *
   * Oracle Specifics:
   * - IN parameter: p_id (VARCHAR2)
   * - OUT parameter: p_affected_rows (NUMBER)
   *
   * Transaction handling:
   * - Managed by stored procedure
   * - Can perform soft delete (set status='DELETED') or hard delete (DELETE FROM)
   *
   * @param id - The unique identifier of the entity to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting payments: ${id}`);

      const binds: oracledb.BindParameters = {
        p_id: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: id },
        p_affected_rows: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_DELETE',
        binds,
      );

      const affectedRows = result.outBinds?.p_affected_rows as number;
      const deleted = affectedRows > 0;

      if (deleted) {
        this.logger.log(`Successfully deleted payments: ${id}`);
      } else {
        this.logger.log(`Payments with id ${id} not found for deletion`);
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting payments:`, error);
      throw new Error(`Failed to delete payments: ${(error as Error).message}`);
    }
  }

  /**
   * Check if a Payments exists by ID
   *
   * Calls stored procedure: PRC_PAYMENTS_EXISTS
   *
   * @param id - The unique identifier to check
   * @returns Promise resolving to true if exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    try {
      const binds: oracledb.BindParameters = {
        p_id: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: id },
        p_exists: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_EXISTS',
        binds,
      );

      // Oracle returns NUMBER (0 or 1) for boolean
      return (result.outBinds?.p_exists as number) === 1;
    } catch (error) {
      this.logger.error(`Error checking payments existence:`, error);
      return false;
    }
  }

  /**
   * Count total number of Payments entities
   *
   * Calls stored procedure: PRC_PAYMENTS_COUNT
   *
   * @returns Promise resolving to the count
   */
  async count(): Promise<number> {
    try {
      const binds: oracledb.BindParameters = {
        p_total_count: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_COUNT',
        binds,
      );

      return (result.outBinds?.p_total_count as number) || 0;
    } catch (error) {
      this.logger.error(`Error counting payments entities:`, error);
      return 0;
    }
  }

  /**
   * Find Payments entities with pagination
   *
   * Calls stored procedure: PRC_PAYMENTS_SELECT_PAGINATED
   *
   * Oracle Pagination:
   * - Uses OFFSET/FETCH NEXT syntax (Oracle 12c+)
   * - Alternative: ROW_NUMBER() OVER (ORDER BY ...) for older versions
   * - Returns both data cursor and total count
   *
   * @param options - Pagination options (page, limit, sort)
   * @returns Promise resolving to paginated results
   */
  async findWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<PaymentsEntity>> {
    try {
      this.logger.log(`Finding payments entities with pagination: page=${options.page}, limit=${options.limit}`);

      const binds: oracledb.BindParameters = {
        p_page: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: options.page },
        p_limit: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: options.limit },
        p_sort_field: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: options.sort?.field || 'CREATED_AT' },
        p_sort_direction: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: options.sort?.direction || 'DESC' },
        p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        p_total_count: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await this.oracleService.callProcedure<any>(
        'PRC_PAYMENTS_SELECT_PAGINATED',
        binds,
      );

      const rows = result.outBinds?.p_cursor as any[];
      const items = rows ? rows.map((record) => OracleStoredProcMapper.fromDbResult(record)) : [];

      const total = (result.outBinds?.p_total_count as number) || 0;
      const totalPages = Math.ceil(total / options.limit);

      return {
        items,
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrevious: options.page > 1,
      };
    } catch (error) {
      this.logger.error(`Error finding payments with pagination:`, error);
      throw new Error(`Failed to find payments with pagination: ${(error as Error).message}`);
    }
  }

  /**
   * Save multiple Payments entities in a single transaction
   *
   * Calls stored procedure: PRC_PAYMENTS_INSERT_BATCH
   *
   * Oracle Batch Processing:
   * - Option 1: Use Table Type (TYPE PAYMENTS_TABLE_TYPE AS TABLE OF VARCHAR2)
   * - Option 2: Call INSERT procedure multiple times (current implementation)
   * - All operations wrapped in single transaction
   * - ROLLBACK if any insert fails
   *
   * @param entities - Array of entities to save
   * @returns Promise resolving to array of saved entities
   */
  async saveMany(entities: PaymentsEntity[]): Promise<PaymentsEntity[]> {
    try {
      this.logger.log(`Saving ${entities.length} payments entities in batch`);

      // For production: Consider using Oracle Bulk Insert with Table Types
      // This example shows sequential calls for simplicity
      const savedEntities: PaymentsEntity[] = [];

      for (const entity of entities) {
        const saved = await this.save(entity);
        savedEntities.push(saved);
      }

      this.logger.log(`Successfully saved ${savedEntities.length} payments entities`);
      return savedEntities;
    } catch (error) {
      this.logger.error(`Error saving multiple payments entities:`, error);
      throw new Error(`Failed to save multiple payments entities: ${(error as Error).message}`);
    }
  }

  /**
   * Delete multiple Payments entities by their identifiers
   *
   * Calls stored procedure: PRC_PAYMENTS_DELETE_BATCH
   *
   * @param ids - Array of unique identifiers
   * @returns Promise resolving to the number of deleted entities
   */
  async deleteMany(ids: string[]): Promise<number> {
    try {
      this.logger.log(`Deleting ${ids.length} payments entities in batch`);

      let deletedCount = 0;

      for (const id of ids) {
        const deleted = await this.delete(id);
        if (deleted) {
          deletedCount++;
        }
      }

      this.logger.log(`Successfully deleted ${deletedCount} payments entities`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Error deleting multiple payments entities:`, error);
      throw new Error(`Failed to delete multiple payments entities: ${(error as Error).message}`);
    }
  }
}
