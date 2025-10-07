export interface HexagonalModuleOptions {
  /**
   * The name of the hexagonal module
   */
  name: string;

  /**
   * Database adapter to generate
   */
  database: 'oracle' | 'mssql' | 'mongodb' | 'none';

  /**
   * Kafka adapter configuration
   */
  kafka: 'none' | 'producer' | 'consumer' | 'both';

  /**
   * The path to create the module
   */
  path?: string;

  /**
   * CRUD implementation mode for relational databases
   */
  crudMode?: 'stored-proc' | 'orm' | 'mixed';

  /**
   * Comma-separated list of operations to implement
   */
  ops?: string;

  /**
   * Run schematic without making changes
   */
  dryRun?: boolean;

  /**
   * Generate database migration scripts
   */
  applyMigrations?: boolean;

  /**
   * Authentication adapter to include
   */
  auth?: 'none' | 'jwt' | 'oauth2';

  /**
   * Schema registry for Kafka
   */
  schemaRegistry?: 'none' | 'confluent';

  /**
   * Skip generating test files
   */
  skipTests?: boolean;

  /**
   * Generate files in flat structure
   */
  flat?: boolean;
}
