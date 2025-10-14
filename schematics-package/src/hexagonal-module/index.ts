import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  url,
  template,
  renameTemplateFiles,
  SchematicsException,
} from '@angular-devkit/schematics';
import { normalize, strings, join } from '@angular-devkit/core';
import chalk from 'chalk';
import { HexagonalModuleOptions } from './schema';

interface NormalizedOptions extends HexagonalModuleOptions {
  moduleName: string;
  moduleClassName: string;
  modulePath: string;
  operations: string[];
}

// ==================== VALIDATION FUNCTIONS ====================

function validateModuleName(name: string): void {
  const pattern = /^[a-z][a-z0-9-]*$/;
  if (!pattern.test(name)) {
    throw new SchematicsException(
      chalk.red(`❌ Invalid module name: "${name}"\n`) +
      chalk.yellow(`Module name must:\n`) +
      chalk.yellow(`  - Start with a lowercase letter\n`) +
      chalk.yellow(`  - Contain only lowercase letters, numbers, and hyphens\n`) +
      chalk.yellow(`  - Example: "payments", "user-management", "order-service"\n`)
    );
  }
}

function validateDatabaseOption(database: string): void {
  const validOptions = ['oracle', 'mssql', 'mongodb', 'none'];
  if (!validOptions.includes(database)) {
    throw new SchematicsException(
      chalk.red(`❌ Invalid database option: "${database}"\n`) +
      chalk.yellow(`Valid options are: ${validOptions.join(', ')}\n`) +
      chalk.yellow(`Example: --database=oracle\n`)
    );
  }
}

function validateKafkaOption(kafka: string): void {
  const validOptions = ['none', 'producer', 'consumer', 'both'];
  if (!validOptions.includes(kafka)) {
    throw new SchematicsException(
      chalk.red(`❌ Invalid kafka option: "${kafka}"\n`) +
      chalk.yellow(`Valid options are: ${validOptions.join(', ')}\n`) +
      chalk.yellow(`Example: --kafka=both\n`)
    );
  }
}

function validateCrudMode(crudMode: string, database: string): void {
  const validModes = ['stored-proc', 'orm', 'mixed'];
  if (!validModes.includes(crudMode)) {
    throw new SchematicsException(
      chalk.red(`❌ Invalid crud-mode: "${crudMode}"\n`) +
      chalk.yellow(`Valid options are: ${validModes.join(', ')}\n`)
    );
  }

  // Warning for non-recommended combinations
  if (database === 'oracle' && crudMode === 'orm') {
    console.warn(
      chalk.yellow(`⚠️  WARNING: Using ORM mode with Oracle.\n`) +
      chalk.yellow(`   Stored procedures are recommended for better performance and maintainability.\n`) +
      chalk.yellow(`   Consider using --crud-mode=stored-proc\n`)
    );
  }

  if (database === 'mssql' && crudMode === 'orm') {
    console.warn(
      chalk.yellow(`⚠️  WARNING: Using ORM mode with SQL Server.\n`) +
      chalk.yellow(`   Stored procedures are recommended for enterprise scenarios.\n`)
    );
  }

  if (database === 'mongodb' && crudMode === 'stored-proc') {
    throw new SchematicsException(
      chalk.red(`❌ Invalid combination: MongoDB does not support stored procedures\n`) +
      chalk.yellow(`Use --crud-mode=orm for MongoDB\n`)
    );
  }
}

function validateOperations(ops: string): string[] {
  const validOps = ['select', 'insert', 'update', 'delete'];
  const operations = ops.split(',').map(op => op.trim().toLowerCase());

  const invalidOps = operations.filter(op => !validOps.includes(op));
  if (invalidOps.length > 0) {
    throw new SchematicsException(
      chalk.red(`❌ Invalid operations: ${invalidOps.join(', ')}\n`) +
      chalk.yellow(`Valid operations are: ${validOps.join(', ')}\n`) +
      chalk.yellow(`Example: --ops=select,insert,update\n`)
    );
  }

  return operations;
}

function validateSchemaRegistry(schemaRegistry: string, kafka: string): void {
  if (schemaRegistry !== 'none' && kafka === 'none') {
    throw new SchematicsException(
      chalk.red(`❌ Schema registry requires Kafka to be enabled\n`) +
      chalk.yellow(`Use --kafka=producer or --kafka=consumer or --kafka=both\n`)
    );
  }

  if (kafka === 'both' && schemaRegistry === 'none') {
    console.warn(
      chalk.yellow(`⚠️  WARNING: Using Kafka without schema registry.\n`) +
      chalk.yellow(`   Schema registry (Confluent) is recommended for production.\n`) +
      chalk.yellow(`   Consider using --schema-registry=confluent\n`)
    );
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Custom string transformation: constantCase
 * Converts a string to CONSTANT_CASE (e.g., "userManagement" -> "USER_MANAGEMENT")
 */
function constantCase(str: string): string {
  return strings.underscore(str).toUpperCase();
}

/**
 * Custom string transformation: uppercase
 * Converts a string to uppercase
 */
function uppercase(str: string): string {
  return str.toUpperCase();
}

/**
 * Custom string transformation: lowercase
 * Converts a string to lowercase
 */
function lowercase(str: string): string {
  return str.toLowerCase();
}

// ==================== NORMALIZATION ====================

function normalizeOptions(options: HexagonalModuleOptions): NormalizedOptions {
  // Normalize kebab-case to camelCase for internal use
  const normalizedOptions = {
    ...options,
    crudMode: options.crudMode || options['crud-mode'] || 'stored-proc',
    dryRun: options.dryRun ?? options['dry-run'] ?? false,
    applyMigrations: options.applyMigrations ?? options['apply-migrations'] ?? false,
    schemaRegistry: options.schemaRegistry || options['schema-registry'] || 'none',
    skipTests: options.skipTests ?? options['skip-tests'] ?? false,
    includeHealth: options.includeHealth ?? options['include-health'] ?? true,
    includeJob: options.includeJob ?? options['include-job'] ?? false,
    keepServiceModule: options.keepServiceModule ?? options['keep-service-module'] ?? true,
  };

  // Validate inputs
  validateModuleName(normalizedOptions.name);
  validateDatabaseOption(normalizedOptions.database);
  validateKafkaOption(normalizedOptions.kafka);

  const crudMode = normalizedOptions.crudMode;
  validateCrudMode(crudMode, normalizedOptions.database);

  const ops = normalizedOptions.ops || 'select,insert,update,delete';
  const operations = validateOperations(ops);

  const schemaRegistry = normalizedOptions.schemaRegistry;
  validateSchemaRegistry(schemaRegistry, normalizedOptions.kafka);

  // Normalize paths and names
  const moduleName = strings.dasherize(normalizedOptions.name);
  const moduleClassName = strings.classify(normalizedOptions.name);
  // Normalize base path first: convert backslashes to forward slashes for cross-platform compatibility
  const rawPath = normalizedOptions.path || 'src/app';
  const normalizedPath = rawPath.replace(/\\/g, '/');
  const basePath = normalize(normalizedPath);
  const modulePath = normalizedOptions.flat
    ? basePath
    : join(basePath, moduleName);

  return {
    ...normalizedOptions,
    moduleName,
    moduleClassName,
    modulePath,
    operations,
    crudMode,
    ops,
    schemaRegistry,
    includeHealth: normalizedOptions.includeHealth,
    includeJob: normalizedOptions.includeJob,
    keepServiceModule: normalizedOptions.keepServiceModule,
  };
}

// ==================== MAIN SCHEMATIC RULE ====================

export function hexagonalModule(options: HexagonalModuleOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Normalize and validate options
    const normalizedOptions = normalizeOptions(options);

    // Log what will be generated
    logGenerationPlan(normalizedOptions, context);

    // Check if module already exists
    const moduleExists = tree.exists(
      `${normalizedOptions.modulePath}/${normalizedOptions.moduleName}.module.ts`
    );
    if (moduleExists) {
      throw new SchematicsException(
        chalk.red(`❌ Module "${normalizedOptions.moduleName}" already exists at ${normalizedOptions.modulePath}\n`) +
        chalk.yellow(`Choose a different name or delete the existing module first.\n`)
      );
    }

    // Generate files from templates
    return chain([
      // Protect schematic source files from being modified
      protectSchematicFiles(),
      generateCoreFiles(normalizedOptions),
      generateDomainLayer(normalizedOptions),
      generateApplicationLayer(normalizedOptions),
      generateAdapters(normalizedOptions),
      generateInfrastructure(normalizedOptions),
      generateTests(normalizedOptions),
      generateDocumentation(normalizedOptions),
      // Clean up shared infrastructure AFTER generation according to selected capabilities
      cleanupSharedInfrastructure(normalizedOptions),
      // Conditionally remove service.module.ts for job-only modules
      cleanupServiceModule(normalizedOptions),
      logSuccess(normalizedOptions),
    ])(tree, context);
  };
}

function logGenerationPlan(options: NormalizedOptions, context: SchematicContext): void {
  context.logger.info(chalk.blue('\n📦 Hexagonal Module Generator\n'));
  context.logger.info(chalk.cyan(`Module:          ${options.moduleClassName}`));
  context.logger.info(chalk.cyan(`Path:            ${options.modulePath}`));
  context.logger.info(chalk.cyan(`Database:        ${options.database}`));
  context.logger.info(chalk.cyan(`Kafka:           ${options.kafka}`));
  context.logger.info(chalk.cyan(`CRUD Mode:       ${options.crudMode}`));
  context.logger.info(chalk.cyan(`Operations:      ${options.operations.join(', ')}`));
  context.logger.info(chalk.cyan(`Auth:            ${options.auth || 'none'}`));
  context.logger.info(chalk.cyan(`Schema Registry: ${options.schemaRegistry}`));
  context.logger.info(chalk.cyan(`Tests:           ${options.skipTests ? 'Skip' : 'Generate'}`));
  context.logger.info(chalk.cyan(`Include Job:     ${options.includeJob ? 'Yes' : 'No'}`));
  
  if (options.includeJob) {
    const serviceModuleStatus = options.keepServiceModule ? 'Keep' : 'Remove';
    context.logger.info(chalk.cyan(`Service Module:  ${serviceModuleStatus}`));
  }
  
  context.logger.info('');
}

// ==================== FILE GENERATION RULES ====================

/**
 * Helper function to create template context with all necessary variables for file name and content processing
 */
function getTemplateContext(options: NormalizedOptions) {
  return {
    ...options,
    ...strings,
    name: options.moduleName,  // For __name__ placeholder in file names
    moduleName: options.moduleName,  // For template interpolation
    // Standard string transformation functions from @angular-devkit/core
    classify: strings.classify,
    dasherize: strings.dasherize,
    camelize: strings.camelize,
    underscore: strings.underscore,
    capitalize: strings.capitalize,
    decamelize: strings.decamelize,
    // Custom string transformation functions
    constantCase: constantCase,
    uppercase: uppercase,
    lowercase: lowercase,
  };
}

/**
 * Custom function to rename files with __name__ placeholder to actual module name
 * This replaces __name__ in file paths with the actual module name
 */
function renameFiles(options: NormalizedOptions): Rule {
  return (tree: Tree) => {
    tree.visit((path) => {
      if (path.includes('__name__')) {
        const newPath = path.replace(/__name__/g, options.moduleName);
        const content = tree.read(path);
        if (content) {
          tree.create(newPath, content);
          tree.delete(path);
        }
      }
    });
    return tree;
  };
}

function generateCoreFiles(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files/core'), [
      applyTemplates(getTemplateContext(options)),
      renameTemplateFiles(),
      move(options.modulePath),
    ])
  );
}

/**
 * Protection rule: prevents any modifications to schematic source files
 * This is critical when running schematics from a monorepo where the schematic package
 * itself is part of the workspace tree.
 */
function protectSchematicFiles(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Create a snapshot of all schematic source file paths to protect
    const protectedPaths: string[] = [];
    
    tree.visit((path) => {
      // Protect any file under schematics-package directory
      if (path.includes('schematics-package/')) {
        protectedPaths.push(path);
      }
    });

    // Override tree methods to prevent modifications to protected paths
    const originalDelete = tree.delete.bind(tree);
    const originalCreate = tree.create.bind(tree);
    const originalOverwrite = tree.overwrite.bind(tree);
    const originalRename = tree.rename.bind(tree);

    tree.delete = function(path: string) {
      if (path.includes('schematics-package/')) {
        context.logger.warn(`⚠️  Blocked attempt to delete protected schematic file: ${path}`);
        return;
      }
      return originalDelete(path);
    };

    tree.create = function(path: string, content: Buffer | string) {
      if (path.includes('schematics-package/')) {
        context.logger.warn(`⚠️  Blocked attempt to create file in protected schematic directory: ${path}`);
        return tree;
      }
      return originalCreate(path, content);
    };

    tree.overwrite = function(path: string, content: Buffer | string) {
      if (path.includes('schematics-package/')) {
        context.logger.warn(`⚠️  Blocked attempt to overwrite protected schematic file: ${path}`);
        return tree;
      }
      return originalOverwrite(path, content);
    };

    tree.rename = function(from: string, to: string) {
      if (from.includes('schematics-package/') || to.includes('schematics-package/')) {
        context.logger.warn(`⚠️  Blocked attempt to rename protected schematic file: ${from} -> ${to}`);
        return tree;
      }
      return originalRename(from, to);
    };

    return tree;
  };
}

/**
 * Conditional cleanup rule: remove service.module.ts if job functionality is enabled
 * and user chose not to keep it
 * 
 * Behavior:
 * - If includeJob is false: service.module.ts is always kept (default behavior)
 * - If includeJob is true AND keepServiceModule is false: service.module.ts is removed
 * - If includeJob is true AND keepServiceModule is true: service.module.ts is kept
 */
function cleanupServiceModule(options: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Only proceed if job functionality is enabled AND user chose not to keep service.module.ts
    if (!options.includeJob || options.keepServiceModule) {
      return tree;
    }

    const serviceModulePath = join(normalize(options.modulePath), 'service.module.ts');
    
    if (tree.exists(serviceModulePath)) {
      context.logger.info(chalk.cyan(`\n🗑️  Removing service.module.ts (job-only module)...`));
      tree.delete(serviceModulePath);
      context.logger.info(chalk.green(`   ✓ Removed service.module.ts`));
      context.logger.info(chalk.gray(`   Note: This is a job/worker-only module\n`));
    }

    return tree;
  };
}

/**
 * Cleanup rule: remove unselected shared infrastructure adapters
 * - Database adapters: keep only the one selected in options.database (oracle | mssql | mongodb)
 * - Kafka: remove share/infrastructure/kafka when options.kafka === 'none'
 *
 * The cleanup is idempotent and only affects the specified directories under
 *   <options.path>/share/infrastructure
 * 
 * This runs AFTER file generation to clean up unselected adapters from the microservice
 */
function cleanupSharedInfrastructure(options: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Compute shared infrastructure base path relative to provided --path
    // Note: The directory is 'share' not 'shared' in the microservice structure
    const pathBase = options.path ? normalize(options.path) : normalize('src');
    const sharedInfraBase = join(pathBase, 'share', 'infrastructure');

    context.logger.info(chalk.cyan(`\n🧹 Cleaning up unselected infrastructure adapters...`));
    context.logger.info(chalk.gray(`   Base path: ${sharedInfraBase}`));
    context.logger.info(chalk.gray(`   Selected database: ${options.database}`));
    context.logger.info(chalk.gray(`   Selected kafka: ${options.kafka}`));

    // Helper function to delete all files within a directory recursively
    const deleteDirectoryContents = (dirPath: string): number => {
      let deletedCount = 0;
      const dir = tree.getDir(dirPath);
      
      // Delete all files in the directory
      dir.subfiles.forEach((fileName) => {
        const filePath = join(normalize(dirPath), fileName);
        if (tree.exists(filePath)) {
          tree.delete(filePath);
          deletedCount++;
        }
      });
      
      // Recursively delete contents of subdirectories
      dir.subdirs.forEach((subDirName) => {
        const subDirPath = join(normalize(dirPath), subDirName);
        deletedCount += deleteDirectoryContents(subDirPath as string);
      });
      
      return deletedCount;
    };

    // Database adapters cleanup: remove all except the selected one
    const dbAdapters = ['oracle', 'mssql', 'mongodb'] as const;
    let removedCount = 0;
    
    dbAdapters.forEach((adapter) => {
      const adapterDir = join(sharedInfraBase, adapter);
      const shouldKeep = options.database === adapter;
      
      try {
        const dir = tree.getDir(adapterDir);
        const exists = dir !== null;
        
        context.logger.info(chalk.gray(`   Checking ${adapter}/: exists=${exists}, shouldKeep=${shouldKeep}`));
        
        if (!shouldKeep && options.database !== 'none' && exists) {
          context.logger.info(chalk.yellow(`   Removing contents of: ${adapterDir}`));
          const deleted = deleteDirectoryContents(adapterDir);
          removedCount += deleted;
          context.logger.info(chalk.green(`   ✓ Cleaned ${adapter}/ - removed ${deleted} file(s)`));
        }
      } catch (e) {
        // Directory doesn't exist, skip
        context.logger.info(chalk.gray(`   ${adapter}/ does not exist, skipping`));
      }
    });

    // If database is 'none', remove all database adapters
    if (options.database === 'none') {
      dbAdapters.forEach((adapter) => {
        const adapterDir = join(sharedInfraBase, adapter);
        try {
          const dir = tree.getDir(adapterDir);
          if (dir !== null) {
            const deleted = deleteDirectoryContents(adapterDir);
            removedCount += deleted;
            context.logger.info(chalk.green(`   ✓ Cleaned ${adapter}/ - removed ${deleted} file(s) (database=none)`));
          }
        } catch (e) {
          // Directory doesn't exist, skip
        }
      });
    }

    // Kafka cleanup: remove only when kafka === 'none'
    if (options.kafka === 'none') {
      const kafkaDir = join(sharedInfraBase, 'kafka');
      try {
        const dir = tree.getDir(kafkaDir);
        if (dir !== null) {
          const deleted = deleteDirectoryContents(kafkaDir);
          removedCount += deleted;
          context.logger.info(chalk.green(`   ✓ Cleaned kafka/ - removed ${deleted} file(s)`));
        }
      } catch (e) {
        // Directory doesn't exist, skip
      }
    }

    context.logger.info(chalk.cyan(`   Cleanup completed. Removed ${removedCount} file(s).\n`));

    return tree;
  };
}

function generateDomainLayer(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files/domain'), [
      applyTemplates(getTemplateContext(options)),
      renameTemplateFiles(),
      move(`${options.modulePath}/domain`),
    ])
  );
}

function generateApplicationLayer(options: NormalizedOptions): Rule {
  return chain([
    // Use cases and DTOs
    mergeWith(
      apply(url('./files/application/usecases'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        move(`${options.modulePath}/application/usecases`),
      ])
    ),
    mergeWith(
      apply(url('./files/application/dtos'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        move(`${options.modulePath}/application/dtos`),
      ])
    ),

    // Health check (ALWAYS generated - not optional)
    mergeWith(
      apply(url('./files/application/health'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        move(`${options.modulePath}/application/health`),
      ])
    ),
  ]);
}

function generateAdapters(options: NormalizedOptions): Rule {
  return chain([
    // Inbound adapters (always generate)
    mergeWith(
      apply(url('./files/adapters/inbound'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        move(`${options.modulePath}/adapters/inbound`),
      ])
    ),

    // Outbound adapters - Database
    options.database !== 'none'
      ? mergeWith(
          apply(url(`./files/adapters/outbound/db/${options.database}`), [
            applyTemplates(getTemplateContext(options)),
            renameTemplateFiles(),
            move(`${options.modulePath}/adapters/outbound/db`),
          ])
        )
      : noop(),

    // Outbound adapters - Kafka
    options.kafka !== 'none'
      ? mergeWith(
          apply(url('./files/adapters/outbound/kafka'), [
            applyTemplates(getTemplateContext(options)),
            renameTemplateFiles(),
            filter(path => {
              if (options.kafka === 'producer' && path.includes('consumer')) return false;
              if (options.kafka === 'consumer' && path.includes('producer')) return false;
              return true;
            }),
            move(`${options.modulePath}/adapters/outbound/kafka`),
          ])
        )
      : noop(),

    // Auth adapters
    options.auth && options.auth !== 'none'
      ? mergeWith(
          apply(url(`./files/adapters/auth/${options.auth}`), [
            applyTemplates(getTemplateContext(options)),
            renameTemplateFiles(),
            move(`${options.modulePath}/adapters/auth`),
          ])
        )
      : noop(),
  ]);
}

function generateInfrastructure(options: NormalizedOptions): Rule {
  return chain([
    // Database scripts for stored procedures
    options.database === 'oracle' || options.database === 'mssql'
      ? mergeWith(
          apply(url(`./files/infra/db/${options.database}`), [
            applyTemplates(getTemplateContext(options)),
            renameTemplateFiles(),
            move(`${options.modulePath}/infra/db`),
          ])
        )
      : noop(),

    // Kafka configuration
    options.kafka !== 'none'
      ? mergeWith(
          apply(url('./files/infra/kafka'), [
            applyTemplates(getTemplateContext(options)),
            renameTemplateFiles(),
            move(`${options.modulePath}/infra/kafka`),
          ])
        )
      : noop(),
  ]);
}

function generateTests(options: NormalizedOptions): Rule {
  if (options.skipTests) {
    return noop();
  }

  return chain([
    // Unit tests
    mergeWith(
      apply(url('./files/tests/unit'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        move(`${options.modulePath}/tests/unit`),
      ])
    ),

    // Integration tests
    mergeWith(
      apply(url('./files/tests/integration'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        filter(path => {
          if (options.database === 'none' && path.includes('repository')) return false;
          if (options.kafka === 'none' && path.includes('kafka')) return false;
          return true;
        }),
        move(`${options.modulePath}/tests/integration`),
      ])
    ),

    // E2E tests
    mergeWith(
      apply(url('./files/tests/e2e'), [
        applyTemplates(getTemplateContext(options)),
        renameTemplateFiles(),
        move(`${options.modulePath}/tests/e2e`),
      ])
    ),
  ]);
}

function generateDocumentation(options: NormalizedOptions): Rule {
  // TODO: Create docs templates directory and implement documentation generation
  return noop();

  // return mergeWith(
  //   apply(url('./files/docs'), [
  //     applyTemplates({
  //       ...getTemplateContext(options),
  //       timestamp: new Date().toISOString(),
  //     }),
  //     renameTemplateFiles(),
  //     move(options.modulePath),
  //   ])
  // );
}

function logSuccess(options: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info(chalk.green('\n✅ Hexagonal module generated successfully!\n'));
    context.logger.info(chalk.cyan('📁 Generated structure:'));
    context.logger.info(chalk.gray(`
${options.modulePath}/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   └── services/
├── application/
│   ├── usecases/
│   └── dtos/
├── adapters/
│   ├── inbound/
│   │   └── http.controller.ts
│   └── outbound/
│       ├── db/
│       └── kafka/
├── infra/
│   ├── db/
│   └── kafka/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── ${options.moduleName}.module.ts
└── README.module.md
    `));

    context.logger.info(chalk.yellow('\n📝 Next steps:'));
    context.logger.info(chalk.gray(`  1. Review generated files in ${options.modulePath}`));
    context.logger.info(chalk.gray(`  2. Configure environment variables (see README.module.md)`));

    if (options.database === 'oracle' || options.database === 'mssql') {
      context.logger.info(chalk.gray(`  3. Review and deploy stored procedures from infra/db/`));
    }

    if (options.kafka !== 'none') {
      context.logger.info(chalk.gray(`  4. Configure Kafka topics and schema registry`));
    }

    context.logger.info(chalk.gray(`  5. Run tests: npm test ${options.modulePath}`));
    context.logger.info(chalk.gray(`  6. Import ${options.moduleClassName}Module in your app.module.ts\n`));

    return tree;
  };
}
