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
  SchematicsException,
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';
import * as chalk from 'chalk';
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

// ==================== NORMALIZATION ====================

function normalizeOptions(options: HexagonalModuleOptions): NormalizedOptions {
  // Validate inputs
  validateModuleName(options.name);
  validateDatabaseOption(options.database);
  validateKafkaOption(options.kafka);

  const crudMode = options.crudMode || 'stored-proc';
  validateCrudMode(crudMode, options.database);

  const ops = options.ops || 'select,insert,update,delete';
  const operations = validateOperations(ops);

  const schemaRegistry = options.schemaRegistry || 'none';
  validateSchemaRegistry(schemaRegistry, options.kafka);

  // Normalize paths and names
  const moduleName = strings.dasherize(options.name);
  const moduleClassName = strings.classify(options.name);
  const basePath = options.path || 'src/app';
  const modulePath = options.flat
    ? normalize(basePath)
    : normalize(`${basePath}/${moduleName}`);

  return {
    ...options,
    moduleName,
    moduleClassName,
    modulePath,
    operations,
    crudMode,
    ops,
    schemaRegistry,
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
      generateCoreFiles(normalizedOptions),
      generateDomainLayer(normalizedOptions),
      generateApplicationLayer(normalizedOptions),
      generateAdapters(normalizedOptions),
      generateInfrastructure(normalizedOptions),
      generateTests(normalizedOptions),
      generateDocumentation(normalizedOptions),
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
  context.logger.info('');
}

// ==================== FILE GENERATION RULES ====================

function generateCoreFiles(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files/core'), [
      applyTemplates({
        ...options,
        ...strings,
        classify: strings.classify,
        dasherize: strings.dasherize,
        camelize: strings.camelize,
      }),
      move(options.modulePath),
    ])
  );
}

function generateDomainLayer(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files/domain'), [
      applyTemplates({
        ...options,
        ...strings,
      }),
      move(`${options.modulePath}/domain`),
    ])
  );
}

function generateApplicationLayer(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files/application'), [
      applyTemplates({
        ...options,
        ...strings,
      }),
      move(`${options.modulePath}/application`),
    ])
  );
}

function generateAdapters(options: NormalizedOptions): Rule {
  return chain([
    // Inbound adapters (always generate)
    mergeWith(
      apply(url('./files/adapters/inbound'), [
        applyTemplates({
          ...options,
          ...strings,
        }),
        move(`${options.modulePath}/adapters/inbound`),
      ])
    ),

    // Outbound adapters - Database
    options.database !== 'none'
      ? mergeWith(
          apply(url(`./files/adapters/outbound/db/${options.database}`), [
            applyTemplates({
              ...options,
              ...strings,
            }),
            move(`${options.modulePath}/adapters/outbound/db`),
          ])
        )
      : noop(),

    // Outbound adapters - Kafka
    options.kafka !== 'none'
      ? mergeWith(
          apply(url('./files/adapters/outbound/kafka'), [
            applyTemplates({
              ...options,
              ...strings,
            }),
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
            applyTemplates({
              ...options,
              ...strings,
            }),
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
            applyTemplates({
              ...options,
              ...strings,
            }),
            move(`${options.modulePath}/infra/db`),
          ])
        )
      : noop(),

    // Kafka configuration
    options.kafka !== 'none'
      ? mergeWith(
          apply(url('./files/infra/kafka'), [
            applyTemplates({
              ...options,
              ...strings,
            }),
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
        applyTemplates({
          ...options,
          ...strings,
        }),
        move(`${options.modulePath}/tests/unit`),
      ])
    ),

    // Integration tests
    mergeWith(
      apply(url('./files/tests/integration'), [
        applyTemplates({
          ...options,
          ...strings,
        }),
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
        applyTemplates({
          ...options,
          ...strings,
        }),
        move(`${options.modulePath}/tests/e2e`),
      ])
    ),
  ]);
}

function generateDocumentation(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files/docs'), [
      applyTemplates({
        ...options,
        ...strings,
        timestamp: new Date().toISOString(),
      }),
      move(options.modulePath),
    ])
  );
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
