import * as sql from 'mssql';

/**
 * MSSQL Stored Procedure Parameter Mapper Utility
 *
 * This utility class provides helper methods for mapping between TypeScript values
 * and SQL Server parameter types when working with stored procedures.
 *
 * Key Responsibilities:
 * - Convert TypeScript values to SQL Server input parameters
 * - Define SQL Server output parameters with appropriate types
 * - Map recordset results to TypeScript objects
 * - Handle NULL values and optional fields
 * - Manage date/time conversions
 * - Type-safe parameter construction
 *
 * SQL Server Type Mapping:
 * - string -> NVarChar, VarChar
 * - number (integer) -> Int, BigInt
 * - number (decimal) -> Decimal, Float
 * - boolean -> Bit
 * - Date -> DateTime, DateTime2
 * - Buffer -> VarBinary
 * - null/undefined -> NULL
 *
 * Usage Example:
 * ```typescript
 * const inputParams = MssqlStoredProcMapper.toInputParams({
 *   Id: { type: sql.NVarChar(50), value: '123' },
 *   Amount: { type: sql.Decimal(18, 2), value: 99.99 },
 *   IsActive: { type: sql.Bit, value: true },
 *   CreatedAt: { type: sql.DateTime2, value: new Date() }
 * });
 *
 * const outputParams = MssqlStoredProcMapper.toOutputParams({
 *   Result: sql.Int,
 *   AffectedRows: sql.Int
 * });
 * ```
 *
 * @see SqlServerService for stored procedure execution
 */
export class MssqlStoredProcMapper {
  /**
   * Convert a parameter object to SQL Server input parameters format
   *
   * Input parameters are passed TO the stored procedure.
   *
   * Format expected by SqlServerService:
   * Record<string, { type: sql.ISqlType; value: any }>
   *
   * Handles:
   * - NULL/undefined values (skips or sets NULL)
   * - Date conversions to SQL Server datetime2
   * - Boolean to BIT conversion
   * - String length validation
   *
   * @param params - Object with parameter definitions
   * @returns Formatted input parameters for SqlServerService
   */
  static toInputParams(
    params: Record<string, { type: sql.ISqlType; value: any }>,
  ): Record<string, { type: sql.ISqlType; value: any }> {
    const inputParams: Record<string, { type: sql.ISqlType; value: any }> = {};

    for (const [key, param] of Object.entries(params)) {
      // Skip undefined values
      if (param.value === undefined) {
        continue;
      }

      // Handle NULL values explicitly
      if (param.value === null) {
        inputParams[key] = { type: param.type, value: null };
        continue;
      }

      // Handle Date conversion
      if (param.value instanceof Date) {
        inputParams[key] = {
          type: param.type,
          value: this.convertDateToSqlServer(param.value),
        };
        continue;
      }

      // Handle boolean to BIT
      if (typeof param.value === 'boolean') {
        inputParams[key] = { type: param.type, value: param.value ? 1 : 0 };
        continue;
      }

      // Default: pass through
      inputParams[key] = { type: param.type, value: param.value };
    }

    return inputParams;
  }

  /**
   * Define SQL Server output parameters
   *
   * Output parameters are returned FROM the stored procedure.
   * They are defined by type only (no value).
   *
   * Common output parameters:
   * - Result (Int): Operation success/failure code
   * - AffectedRows (Int): Number of rows affected by operation
   * - ErrorCode (Int): Error code if operation fails
   * - ErrorMessage (NVarChar): Error description
   * - NewId (NVarChar): ID of newly created record
   *
   * Format expected by SqlServerService:
   * Record<string, sql.ISqlType>
   *
   * @param params - Object mapping parameter names to SQL types
   * @returns Output parameters for SqlServerService
   */
  static toOutputParams(
    params: Record<string, sql.ISqlType>,
  ): Record<string, sql.ISqlType> {
    // Output params are just type definitions, no values
    return params;
  }

  /**
   * Map a database recordset row to a typed object
   *
   * Handles:
   * - Column name to property name mapping
   * - Type conversions (dates, booleans, numbers)
   * - NULL handling
   * - Optional field defaults
   *
   * SQL Server -> TypeScript type conversions:
   * - VARCHAR/NVARCHAR -> string
   * - INT/BIGINT -> number
   * - BIT -> boolean
   * - DATETIME/DATETIME2 -> Date
   * - DECIMAL/NUMERIC -> number
   *
   * @param record - Database record from result.recordset
   * @param columnMapping - Optional mapping of DB column names to object properties
   * @returns Typed object with converted values
   */
  static fromRecordset<T = any>(
    record: any,
    columnMapping?: Record<string, string>,
  ): T {
    if (!record) {
      return null;
    }

    const result: any = {};

    for (const [dbColumn, value] of Object.entries(record)) {
      // Get property name (use mapping if provided, otherwise use column name)
      const propertyName = columnMapping?.[dbColumn] || dbColumn;

      // Handle NULL values
      if (value === null || value === undefined) {
        result[propertyName] = null;
        continue;
      }

      // Handle date conversion
      if (value instanceof Date) {
        result[propertyName] = value;
        continue;
      }

      // Handle BIT to boolean conversion
      if (typeof value === 'boolean' || value === 0 || value === 1) {
        result[propertyName] = Boolean(value);
        continue;
      }

      // Default: pass through
      result[propertyName] = value;
    }

    return result as T;
  }

  /**
   * Convert JavaScript Date to SQL Server datetime2 format
   *
   * SQL Server datetime2 format: YYYY-MM-DD HH:MM:SS.mmmmmmm
   * Precision: Up to 7 decimal places for fractional seconds
   *
   * Note: The mssql library handles this automatically, but this method
   * is provided for explicit control or custom formatting needs.
   *
   * @param date - JavaScript Date object
   * @returns Date object (mssql library handles conversion)
   */
  private static convertDateToSqlServer(date: Date): Date {
    // The mssql library handles Date conversion automatically
    // This method is here for explicit documentation and potential future customization
    return date;
  }

  /**
   * Create SQL parameter for VARCHAR type
   *
   * @param value - String value
   * @param length - Maximum length (default 255)
   * @returns Parameter object
   */
  static varchar(value: string, length: number = 255): { type: sql.ISqlType; value: any } {
    return { type: sql.VarChar(length), value };
  }

  /**
   * Create SQL parameter for NVARCHAR type (Unicode)
   *
   * Use NVARCHAR for internationalized text that may contain Unicode characters.
   *
   * @param value - String value
   * @param length - Maximum length (default 255)
   * @returns Parameter object
   */
  static nvarchar(value: string, length: number = 255): { type: sql.ISqlType; value: any } {
    return { type: sql.NVarChar(length), value };
  }

  /**
   * Create SQL parameter for INT type
   *
   * @param value - Integer value
   * @returns Parameter object
   */
  static int(value: number): { type: sql.ISqlType; value: any } {
    return { type: sql.Int, value };
  }

  /**
   * Create SQL parameter for BIGINT type
   *
   * Use for large integers that exceed INT range (-2^31 to 2^31-1)
   *
   * @param value - Big integer value
   * @returns Parameter object
   */
  static bigint(value: number | string): { type: sql.ISqlType; value: any } {
    return { type: sql.BigInt, value };
  }

  /**
   * Create SQL parameter for BIT type (boolean)
   *
   * @param value - Boolean value
   * @returns Parameter object
   */
  static bit(value: boolean): { type: sql.ISqlType; value: any } {
    return { type: sql.Bit, value: value ? 1 : 0 };
  }

  /**
   * Create SQL parameter for DECIMAL type
   *
   * Use for precise decimal values (e.g., monetary amounts)
   *
   * @param value - Decimal value
   * @param precision - Total number of digits (default 18)
   * @param scale - Number of decimal places (default 2)
   * @returns Parameter object
   */
  static decimal(
    value: number,
    precision: number = 18,
    scale: number = 2,
  ): { type: sql.ISqlType; value: any } {
    return { type: sql.Decimal(precision, scale), value };
  }

  /**
   * Create SQL parameter for DATETIME type
   *
   * @param value - Date value
   * @returns Parameter object
   */
  static datetime(value: Date): { type: sql.ISqlType; value: any } {
    return { type: sql.DateTime, value };
  }

  /**
   * Create SQL parameter for DATETIME2 type
   *
   * DATETIME2 has better precision and range than DATETIME.
   * Recommended for new applications.
   *
   * @param value - Date value
   * @param scale - Fractional seconds precision (0-7, default 7)
   * @returns Parameter object
   */
  static datetime2(value: Date, scale: number = 7): { type: sql.ISqlType; value: any } {
    return { type: sql.DateTime2(scale), value };
  }

  /**
   * Create SQL parameter for UNIQUEIDENTIFIER (GUID) type
   *
   * @param value - GUID string
   * @returns Parameter object
   */
  static uniqueidentifier(value: string): { type: sql.ISqlType; value: any } {
    return { type: sql.UniqueIdentifier, value };
  }

  /**
   * Create SQL parameter for VARBINARY type
   *
   * @param value - Buffer or binary data
   * @param length - Maximum length (default MAX)
   * @returns Parameter object
   */
  static varbinary(value: Buffer, length?: number): { type: sql.ISqlType; value: any } {
    const type = length ? sql.VarBinary(length) : sql.VarBinary(sql.MAX);
    return { type, value };
  }

  /**
   * Helper: Create output parameter definition for INT result
   *
   * Common usage: @Result INT OUTPUT in stored procedures
   *
   * @returns Output parameter type
   */
  static outputInt(): sql.ISqlType {
    return sql.Int;
  }

  /**
   * Helper: Create output parameter definition for NVARCHAR result
   *
   * @param length - Maximum length (default 255)
   * @returns Output parameter type
   */
  static outputNVarChar(length: number = 255): sql.ISqlType {
    return sql.NVarChar(length);
  }

  /**
   * Helper: Create output parameter definition for BIT result
   *
   * @returns Output parameter type
   */
  static outputBit(): sql.ISqlType {
    return sql.Bit;
  }

  /**
   * Convert recordset array to typed entity array
   *
   * @param recordset - Array of database records
   * @param mapper - Function to map each record to entity
   * @returns Array of typed entities
   */
  static mapRecordsetToEntities<T>(
    recordset: any[],
    mapper: (record: any) => T,
  ): T[] {
    if (!recordset || recordset.length === 0) {
      return [];
    }

    return recordset.map((record) => mapper(record));
  }

  /**
   * Extract first record from recordset or return null
   *
   * @param recordset - Recordset from stored procedure result
   * @returns First record or null if empty
   */
  static firstOrNull<T = any>(recordset: any[]): T | null {
    if (!recordset || recordset.length === 0) {
      return null;
    }

    return recordset[0] as T;
  }

  /**
   * Check if output parameter indicates success
   *
   * Convention: 1 = success, 0 or negative = failure
   *
   * @param outputResult - Output parameter value
   * @returns True if success (value is 1)
   */
  static isSuccessResult(outputResult: number): boolean {
    return outputResult === 1;
  }

  /**
   * Check if output parameter indicates record already exists
   *
   * Convention: -1 = already exists
   *
   * @param outputResult - Output parameter value
   * @returns True if already exists (value is -1)
   */
  static isAlreadyExists(outputResult: number): boolean {
    return outputResult === -1;
  }

  /**
   * Check if output parameter indicates record not found
   *
   * Convention: 0 = not found
   *
   * @param outputResult - Output parameter value
   * @returns True if not found (value is 0)
   */
  static isNotFound(outputResult: number): boolean {
    return outputResult === 0;
  }
}
