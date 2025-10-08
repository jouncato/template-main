import {
  Rule,
  SchematicContext,
  Tree,
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  url,
  SchematicsException,
  externalSchematic,
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import chalk from 'chalk';
import { ApplicationOptions } from './schema';

interface NormalizedOptions extends ApplicationOptions {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

// ==================== VALIDATION FUNCTIONS ====================

function validateApplicationName(name: string): void {
  const pattern = /^[a-zA-Z][a-zA-Z0-9-_]*$/;
  if (!pattern.test(name)) {
    throw new SchematicsException(
      chalk.red(`❌ Invalid application name: "${name}"\n`) +
      chalk.yellow(`Application name must:\n`) +
      chalk.yellow(`  - Start with a letter\n`) +
      chalk.yellow(`  - Contain only letters, numbers, hyphens, and underscores\n`) +
      chalk.yellow(`  - Example: "my-app", "MyApp", "my_app"\n`)
    );
  }
}

// ==================== NORMALIZATION ====================

function normalizeOptions(options: ApplicationOptions): NormalizedOptions {
  validateApplicationName(options.name);

  const projectName = strings.dasherize(options.name);
  const projectDirectory = options.directory || projectName;
  const projectRoot = normalize(projectDirectory);

  return {
    ...options,
    projectName,
    projectDirectory,
    projectRoot,
    packageManager: options.packageManager || 'npm',
    skipGit: options.skipGit ?? false,
    skipInstall: options.skipInstall ?? false,
    strict: options.strict ?? false,
  };
}

// ==================== MAIN SCHEMATIC RULE ====================

export function application(options: ApplicationOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const normalizedOptions = normalizeOptions(options);

    logGenerationPlan(normalizedOptions, context);

    // Check if directory already exists
    if (tree.exists(normalizedOptions.projectRoot)) {
      throw new SchematicsException(
        chalk.red(`❌ Directory "${normalizedOptions.projectDirectory}" already exists\n`) +
        chalk.yellow(`Choose a different name or delete the existing directory first.\n`)
      );
    }

    return chain([
      // Generate base application structure
      generateApplicationFiles(normalizedOptions),
      
      // Update package.json with project name
      updatePackageJson(normalizedOptions),
      
      // Update other configuration files
      updateConfigurationFiles(normalizedOptions),
      
      // Initialize git repository if not skipped
      initializeGitRepository(normalizedOptions),
      
      // Install dependencies if not skipped
      installDependencies(normalizedOptions),
      
      // Log success message
      logSuccess(normalizedOptions),
    ])(tree, context);
  };
}

function logGenerationPlan(options: NormalizedOptions, context: SchematicContext): void {
  context.logger.info(chalk.blue('\n📦 NestJS Application Generator\n'));
  context.logger.info(chalk.cyan(`Application:     ${options.projectName}`));
  context.logger.info(chalk.cyan(`Directory:       ${options.projectDirectory}`));
  context.logger.info(chalk.cyan(`Package Manager: ${options.packageManager}`));
  context.logger.info(chalk.cyan(`Skip Git:        ${options.skipGit ? 'Yes' : 'No'}`));
  context.logger.info(chalk.cyan(`Skip Install:    ${options.skipInstall ? 'Yes' : 'No'}`));
  context.logger.info(chalk.cyan(`Strict Mode:     ${options.strict ? 'Yes' : 'No'}`));
  context.logger.info('');
}

function generateApplicationFiles(options: NormalizedOptions): Rule {
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({
        ...options,
        ...strings,
        serviceName: options.projectName,
        service_name: options.projectName,
      }),
      move(options.projectRoot),
    ])
  );
}

function updatePackageJson(options: NormalizedOptions): Rule {
  return (tree: Tree) => {
    const packageJsonPath = `${options.projectRoot}/package.json`;
    
    if (!tree.exists(packageJsonPath)) {
      return tree;
    }

    const packageJsonContent = tree.read(packageJsonPath);
    if (!packageJsonContent) {
      return tree;
    }

    const packageJson = JSON.parse(packageJsonContent.toString());
    
    // Update name
    packageJson.name = options.projectName;
    
    // Update description if needed
    if (packageJson.description === '') {
      packageJson.description = `${options.projectName} - NestJS Application`;
    }

    tree.overwrite(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    return tree;
  };
}

function updateConfigurationFiles(options: NormalizedOptions): Rule {
  return (tree: Tree) => {
    // Update Dockerfile
    const dockerfilePath = `${options.projectRoot}/Dockerfile`;
    if (tree.exists(dockerfilePath)) {
      let dockerfileContent = tree.read(dockerfilePath)!.toString();
      dockerfileContent = dockerfileContent.replace(
        /ARG MICRO_NAME=\{service_name\}/g,
        `ARG MICRO_NAME=${options.projectName}`
      );
      tree.overwrite(dockerfilePath, dockerfileContent);
    }

    // Update .env.example
    const envExamplePath = `${options.projectRoot}/.env.example`;
    if (tree.exists(envExamplePath)) {
      let envContent = tree.read(envExamplePath)!.toString();
      envContent = envContent.replace(
        /SERVICE_NAME="\{service_name\}"/g,
        `SERVICE_NAME="${options.projectName}"`
      );
      tree.overwrite(envExamplePath, envContent);
    }

    return tree;
  };
}

function initializeGitRepository(options: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.skipGit) {
      return tree;
    }

    context.logger.info(chalk.gray('📝 Git repository will be initialized after file generation'));
    
    return tree;
  };
}

function installDependencies(options: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (options.skipInstall) {
      context.logger.info(chalk.yellow('\n⚠️  Skipping package installation'));
      context.logger.info(chalk.gray(`Run '${options.packageManager} install' manually in the project directory\n`));
      return tree;
    }

    context.addTask(new NodePackageInstallTask({
      workingDirectory: options.projectRoot,
      packageManager: options.packageManager,
    }));

    context.logger.info(chalk.gray(`\n📦 Installing dependencies with ${options.packageManager}...\n`));
    
    return tree;
  };
}

function logSuccess(options: NormalizedOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info(chalk.green('\n✅ Application generated successfully!\n'));
    
    context.logger.info(chalk.cyan('📁 Project structure:'));
    context.logger.info(chalk.gray(`
${options.projectDirectory}/
├── src/
│   ├── app/
│   │   ├── application/        # Application services
│   │   ├── domain/             # Domain layer (DTOs, interfaces)
│   │   ├── healtcheck.backup/  # Backup healthcheck module
│   │   ├── infrastructure/     # Infrastructure adapters
│   │   └── interfaces/         # Controllers and modules
│   ├── share/
│   │   ├── domain/             # Shared domain logic
│   │   ├── infrastructure/     # Shared infrastructure (Oracle, MSSQL, Kafka, HTTP)
│   │   ├── interfaces/         # Shared interfaces (filters)
│   │   └── utils/              # Utilities
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Application entry point
├── test/                       # Test files
├── deploy/                     # Deployment configuration
├── package.json
├── tsconfig.json
├── nest-cli.json
├── Dockerfile
└── .env.example
    `));

    context.logger.info(chalk.yellow('\n📝 Next steps:'));
    context.logger.info(chalk.gray(`  1. cd ${options.projectDirectory}`));
    
    if (options.skipInstall) {
      context.logger.info(chalk.gray(`  2. ${options.packageManager} install`));
      context.logger.info(chalk.gray(`  3. Copy .env.example to .env and configure`));
      context.logger.info(chalk.gray(`  4. ${options.packageManager} run start:dev`));
    } else {
      context.logger.info(chalk.gray(`  2. Copy .env.example to .env and configure`));
      context.logger.info(chalk.gray(`  3. ${options.packageManager} run start:dev`));
    }

    if (!options.skipGit) {
      context.logger.info(chalk.gray(`  ${options.skipInstall ? '5' : '4'}. git init && git add . && git commit -m "Initial commit"`));
    }

    context.logger.info(chalk.gray('\n💡 To generate hexagonal modules, use:'));
    context.logger.info(chalk.gray(`  nest g @template/schematics:hexagonal-module <module-name> --database=<oracle|mssql|mongodb> --kafka=<none|producer|consumer|both>\n`));

    return tree;
  };
}
