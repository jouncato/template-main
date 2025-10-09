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
   * Supports both kebab-case (crud-mode) and camelCase (crudMode)
   */
  'crud-mode'?: 'stored-proc' | 'orm' | 'mixed';
  crudMode?: 'stored-proc' | 'orm' | 'mixed';

  /**
   * Comma-separated list of operations to implement
   */
  ops?: string;

  /**
   * Run schematic without making changes
   * Supports both kebab-case (dry-run) and camelCase (dryRun)
   */
  'dry-run'?: boolean;
  dryRun?: boolean;

  /**
   * Generate database migration scripts
   * Supports both kebab-case (apply-migrations) and camelCase (applyMigrations)
   */
  'apply-migrations'?: boolean;
  applyMigrations?: boolean;

  /**
   * Authentication adapter to include
   */
  auth?: 'none' | 'jwt' | 'oauth2';

  /**
   * Schema registry for Kafka
   * Supports both kebab-case (schema-registry) and camelCase (schemaRegistry)
   */
  'schema-registry'?: 'none' | 'confluent';
  schemaRegistry?: 'none' | 'confluent';

  /**
   * Skip generating test files
   * Supports both kebab-case (skip-tests) and camelCase (skipTests)
   */
  'skip-tests'?: boolean;
  skipTests?: boolean;

  /**
   * Generate files in flat structure
   */
  flat?: boolean;

  /**
   * Include health check endpoint for module infrastructure
   * Supports both kebab-case (include-health) and camelCase (includeHealth)
   */
  'include-health'?: boolean;
  includeHealth?: boolean;

  /**
   * Include job/worker functionality (async processing, scheduled tasks)
   * Supports both kebab-case (include-job) and camelCase (includeJob)
   */
  'include-job'?: boolean;
  includeJob?: boolean;

  /**
   * Keep service.module.ts when job functionality is enabled
   * Only relevant if include-job is true
   * Supports both kebab-case (keep-service-module) and camelCase (keepServiceModule)
   */
  'keep-service-module'?: boolean;
  keepServiceModule?: boolean;
}
