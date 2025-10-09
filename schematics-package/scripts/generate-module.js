#!/usr/bin/env node

/**
 * Wrapper script para generar módulos hexagonales con todas las opciones soportadas
 *
 * Uso: node scripts/generate-module.js <nombre> --database=<db> [opciones]
 *
 * Este script resuelve el problema de que el NestJS CLI no pasa correctamente
 * las opciones personalizadas a schematics de terceros.
 */

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printHelp();
  process.exit(0);
}

const moduleName = args[0];
const options = parseOptions(args.slice(1));

// Validate required options
if (!options.database) {
  console.error(chalk.red('\n❌ Error: --database option is required\n'));
  printHelp();
  process.exit(1);
}

// Build schematics command
const schematicsPath = path.resolve(__dirname, '../node_modules/.bin/schematics');
const collectionPath = path.resolve(__dirname, '../dist/collection.json');

const schematicsArgs = [
  `${collectionPath}:hexagonal-module`,
  moduleName,
  `--database=${options.database}`,
];

// Add optional parameters
if (options.kafka) schematicsArgs.push(`--kafka=${options.kafka}`);
if (options.path) schematicsArgs.push(`--path=${options.path}`);
if (options.crudMode) schematicsArgs.push(`--crud-mode=${options.crudMode}`);
if (options.ops) schematicsArgs.push(`--ops=${options.ops}`);
if (options.auth) schematicsArgs.push(`--auth=${options.auth}`);
if (options.schemaRegistry) schematicsArgs.push(`--schema-registry=${options.schemaRegistry}`);
if (options.dryRun) schematicsArgs.push('--dry-run');
if (options.skipTests) schematicsArgs.push('--skip-tests');
if (options.flat) schematicsArgs.push('--flat');
if (options.applyMigrations) schematicsArgs.push('--apply-migrations');

console.log(chalk.blue('\n📦 Generating Hexagonal Module...\n'));
console.log(chalk.gray(`Command: npx @angular-devkit/schematics-cli ${schematicsArgs.join(' ')}\n`));

// Execute schematics using npx
const npxArgs = ['-p', '@angular-devkit/schematics-cli', 'schematics', ...schematicsArgs];
const schematics = spawn('npx', npxArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

schematics.on('error', (error) => {
  console.error(chalk.red(`\n❌ Error executing schematics: ${error.message}\n`));
  console.error(chalk.yellow(`\nTip: Make sure npm is installed and accessible.\n`));
  process.exit(1);
});

schematics.on('close', (code) => {
  if (code !== 0) {
    console.error(chalk.red(`\n❌ Schematic execution failed with code ${code}\n`));
    process.exit(code);
  }
  console.log(chalk.green('\n✅ Module generated successfully!\n'));
  process.exit(0);
});

// Helper functions

function parseOptions(args) {
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

      if (value === undefined) {
        // Boolean flag
        options[camelKey] = true;
      } else {
        options[camelKey] = value;
      }
    }
  });

  return options;
}

function printHelp() {
  console.log(chalk.blue('\n📦 Hexagonal Module Generator\n'));
  console.log(chalk.white('Usage:'));
  console.log(chalk.gray('  node scripts/generate-module.js <module-name> --database=<db> [options]\n'));

  console.log(chalk.white('Required Options:'));
  console.log(chalk.gray('  --database=<db>           Database adapter (oracle|mssql|mongodb|none)\n'));

  console.log(chalk.white('Optional Options:'));
  console.log(chalk.gray('  --path=<path>             Path where to create the module (default: src/app)'));
  console.log(chalk.gray('  --kafka=<mode>            Kafka capabilities (none|producer|consumer|both)'));
  console.log(chalk.gray('  --crud-mode=<mode>        CRUD mode (stored-proc|orm|mixed)'));
  console.log(chalk.gray('  --ops=<operations>        Operations (select,insert,update,delete)'));
  console.log(chalk.gray('  --auth=<type>             Authentication (none|jwt|oauth2)'));
  console.log(chalk.gray('  --schema-registry=<type>  Schema registry (none|confluent)'));
  console.log(chalk.gray('  --dry-run                 Run without making changes'));
  console.log(chalk.gray('  --skip-tests              Skip test generation'));
  console.log(chalk.gray('  --flat                    Flat structure (no subdirectories)'));
  console.log(chalk.gray('  --apply-migrations        Generate migration scripts\n'));

  console.log(chalk.white('Examples:'));
  console.log(chalk.gray('  # Basic module with Oracle'));
  console.log(chalk.cyan('  node scripts/generate-module.js payments --database=oracle\n'));

  console.log(chalk.gray('  # Module with Oracle and Kafka'));
  console.log(chalk.cyan('  node scripts/generate-module.js payments --database=oracle --kafka=both\n'));

  console.log(chalk.gray('  # Module with custom path'));
  console.log(chalk.cyan('  node scripts/generate-module.js payments --database=oracle --path=src/modules\n'));

  console.log(chalk.gray('  # Dry run'));
  console.log(chalk.cyan('  node scripts/generate-module.js payments --database=oracle --dry-run\n'));
}
