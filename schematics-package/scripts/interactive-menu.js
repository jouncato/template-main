#!/usr/bin/env node

const readline = require('readline');
const { spawn } = require('child_process');
const chalk = require('chalk');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para hacer preguntas
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Función para mostrar el menú principal
function showMainMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║     🏗️  GENERADOR DE PROYECTOS NESTJS - MENÚ INTERACTIVO  ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════════╝\n'));
  console.log(chalk.cyan('Selecciona una opción:\n'));
  console.log(chalk.white('  1. ') + chalk.green('Generar Aplicación Completa') + chalk.gray(' (nest new)'));
  console.log(chalk.white('  2. ') + chalk.yellow('Generar Módulo Hexagonal') + chalk.gray(' (dentro de proyecto existente)'));
  console.log(chalk.white('  3. ') + chalk.magenta('Ver Ejemplos de Uso'));
  console.log(chalk.white('  4. ') + chalk.blue('Ayuda y Documentación'));
  console.log(chalk.white('  5. ') + chalk.red('Salir\n'));
}

// Función para generar aplicación
async function generateApplication() {
  console.clear();
  console.log(chalk.blue.bold('\n📦 GENERADOR DE APLICACIÓN COMPLETA\n'));
  
  // Nombre del proyecto
  const name = await question(chalk.cyan('Nombre del proyecto (ej: payments-service): '));
  if (!name) {
    console.log(chalk.red('❌ El nombre es requerido'));
    await question(chalk.gray('\nPresiona Enter para continuar...'));
    return;
  }

  // Directorio
  const useCustomDir = await question(chalk.cyan(`¿Usar directorio personalizado? (s/N): `));
  let directory = '';
  if (useCustomDir.toLowerCase() === 's') {
    directory = await question(chalk.cyan('Directorio (ej: apps/my-service): '));
  }

  // Package manager
  console.log(chalk.cyan('\nGestor de paquetes:'));
  console.log('  1. npm (default)');
  console.log('  2. yarn');
  console.log('  3. pnpm');
  const pmChoice = await question(chalk.cyan('Selecciona (1-3): '));
  const packageManagers = { '1': 'npm', '2': 'yarn', '3': 'pnpm' };
  const packageManager = packageManagers[pmChoice] || 'npm';

  // Skip install
  const skipInstall = await question(chalk.cyan('¿Omitir instalación de dependencias? (s/N): '));
  
  // Skip git
  const skipGit = await question(chalk.cyan('¿Omitir inicialización de git? (s/N): '));

  // Modo estricto
  const strict = await question(chalk.cyan('¿Habilitar modo estricto de TypeScript? (s/N): '));

  // Construir comando
  let command = `nest g @template/schematics:application ${name}`;
  if (directory) command += ` --directory="${directory}"`;
  if (packageManager !== 'npm') command += ` --package-manager=${packageManager}`;
  if (skipInstall.toLowerCase() === 's') command += ' --skip-install';
  if (skipGit.toLowerCase() === 's') command += ' --skip-git';
  if (strict.toLowerCase() === 's') command += ' --strict';

  // Mostrar resumen
  console.log(chalk.blue.bold('\n📋 RESUMEN DE CONFIGURACIÓN:\n'));
  console.log(chalk.white('  Nombre:           ') + chalk.green(name));
  if (directory) console.log(chalk.white('  Directorio:       ') + chalk.green(directory));
  console.log(chalk.white('  Package Manager:  ') + chalk.green(packageManager));
  console.log(chalk.white('  Skip Install:     ') + (skipInstall.toLowerCase() === 's' ? chalk.yellow('Sí') : chalk.green('No')));
  console.log(chalk.white('  Skip Git:         ') + (skipGit.toLowerCase() === 's' ? chalk.yellow('Sí') : chalk.green('No')));
  console.log(chalk.white('  Modo Estricto:    ') + (strict.toLowerCase() === 's' ? chalk.green('Sí') : chalk.gray('No')));
  
  console.log(chalk.gray('\n  Comando: ') + chalk.cyan(command));

  const confirm = await question(chalk.yellow('\n¿Ejecutar generación? (S/n): '));
  if (confirm.toLowerCase() === 'n') {
    console.log(chalk.yellow('⚠️  Generación cancelada'));
    await question(chalk.gray('\nPresiona Enter para continuar...'));
    return;
  }

  // Ejecutar comando
  console.log(chalk.blue('\n🚀 Generando aplicación...\n'));
  
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: 'inherit' });
    
    child.on('close', async (code) => {
      if (code === 0) {
        console.log(chalk.green.bold('\n✅ ¡Aplicación generada exitosamente!\n'));
        console.log(chalk.cyan('📝 Próximos pasos:\n'));
        console.log(chalk.white(`  1. cd ${directory || name}`));
        if (skipInstall.toLowerCase() === 's') {
          console.log(chalk.white(`  2. ${packageManager} install`));
          console.log(chalk.white('  3. cp .env.example .env'));
          console.log(chalk.white('  4. # Editar .env con tus credenciales'));
          console.log(chalk.white(`  5. ${packageManager} run start:dev`));
        } else {
          console.log(chalk.white('  2. cp .env.example .env'));
          console.log(chalk.white('  3. # Editar .env con tus credenciales'));
          console.log(chalk.white(`  4. ${packageManager} run start:dev`));
        }
      } else {
        console.log(chalk.red.bold('\n❌ Error al generar la aplicación'));
      }
      await question(chalk.gray('\nPresiona Enter para continuar...'));
      resolve();
    });
  });
}

// Función para generar módulo hexagonal
async function generateModule() {
  console.clear();
  console.log(chalk.blue.bold('\n📦 GENERADOR DE MÓDULO HEXAGONAL\n'));
  
  // Nombre del módulo
  const name = await question(chalk.cyan('Nombre del módulo (kebab-case, ej: payments): '));
  if (!name) {
    console.log(chalk.red('❌ El nombre es requerido'));
    await question(chalk.gray('\nPresiona Enter para continuar...'));
    return;
  }

  // Base de datos
  console.log(chalk.cyan('\nBase de datos:'));
  console.log('  1. Oracle (stored procedures)');
  console.log('  2. SQL Server (stored procedures)');
  console.log('  3. MongoDB (Mongoose ORM)');
  console.log('  4. Ninguna');
  const dbChoice = await question(chalk.cyan('Selecciona (1-4): '));
  const databases = { '1': 'oracle', '2': 'mssql', '3': 'mongodb', '4': 'none' };
  const database = databases[dbChoice];
  
  if (!database) {
    console.log(chalk.red('❌ Opción inválida'));
    await question(chalk.gray('\nPresiona Enter para continuar...'));
    return;
  }

  // CRUD Mode (solo si no es MongoDB ni none)
  let crudMode = 'stored-proc';
  if (database === 'oracle' || database === 'mssql') {
    console.log(chalk.cyan('\nModo CRUD:'));
    console.log('  1. Stored Procedures (recomendado)');
    console.log('  2. ORM');
    console.log('  3. Mixto');
    const crudChoice = await question(chalk.cyan('Selecciona (1-3): '));
    const crudModes = { '1': 'stored-proc', '2': 'orm', '3': 'mixed' };
    crudMode = crudModes[crudChoice] || 'stored-proc';
  } else if (database === 'mongodb') {
    crudMode = 'orm';
  }

  // Kafka
  console.log(chalk.cyan('\nCapacidades Kafka:'));
  console.log('  1. Ninguna');
  console.log('  2. Producer (publicar eventos)');
  console.log('  3. Consumer (consumir eventos)');
  console.log('  4. Ambos (Producer + Consumer)');
  const kafkaChoice = await question(chalk.cyan('Selecciona (1-4): '));
  const kafkaOptions = { '1': 'none', '2': 'producer', '3': 'consumer', '4': 'both' };
  const kafka = kafkaOptions[kafkaChoice] || 'none';

  // Operaciones CRUD
  console.log(chalk.cyan('\nOperaciones CRUD a implementar:'));
  console.log('  1. Todas (select, insert, update, delete)');
  console.log('  2. Solo lectura (select)');
  console.log('  3. Lectura y escritura (select, insert, update)');
  console.log('  4. Personalizado');
  const opsChoice = await question(chalk.cyan('Selecciona (1-4): '));
  let ops = 'select,insert,update,delete';
  if (opsChoice === '2') ops = 'select';
  else if (opsChoice === '3') ops = 'select,insert,update';
  else if (opsChoice === '4') {
    ops = await question(chalk.cyan('Operaciones (separadas por coma, ej: select,insert): '));
  }

  // Autenticación
  console.log(chalk.cyan('\nAutenticación:'));
  console.log('  1. Ninguna');
  console.log('  2. JWT');
  console.log('  3. OAuth2');
  const authChoice = await question(chalk.cyan('Selecciona (1-3): '));
  const authOptions = { '1': 'none', '2': 'jwt', '3': 'oauth2' };
  const auth = authOptions[authChoice] || 'none';

  // Schema Registry
  let schemaRegistry = 'none';
  if (kafka !== 'none') {
    const useRegistry = await question(chalk.cyan('¿Usar Confluent Schema Registry? (s/N): '));
    if (useRegistry.toLowerCase() === 's') {
      schemaRegistry = 'confluent';
    }
  }

  // Path
  const customPath = await question(chalk.cyan('Ruta del módulo (Enter para src/app): '));
  const path = customPath || 'src/app';

  // Skip tests
  const skipTests = await question(chalk.cyan('¿Omitir generación de tests? (s/N): '));

  // Construir comando
  let command = `nest g @template/schematics:hexagonal-module ${name}`;
  command += ` --database=${database}`;
  if (kafka !== 'none') command += ` --kafka=${kafka}`;
  if (crudMode !== 'stored-proc') command += ` --crud-mode=${crudMode}`;
  if (ops !== 'select,insert,update,delete') command += ` --ops=${ops}`;
  if (auth !== 'none') command += ` --auth=${auth}`;
  if (schemaRegistry !== 'none') command += ` --schema-registry=${schemaRegistry}`;
  if (path !== 'src/app') command += ` --path=${path}`;
  if (skipTests.toLowerCase() === 's') command += ' --skip-tests';

  // Mostrar resumen
  console.log(chalk.blue.bold('\n📋 RESUMEN DE CONFIGURACIÓN:\n'));
  console.log(chalk.white('  Módulo:           ') + chalk.green(name));
  console.log(chalk.white('  Base de datos:    ') + chalk.green(database));
  if (database !== 'none') console.log(chalk.white('  Modo CRUD:        ') + chalk.green(crudMode));
  console.log(chalk.white('  Kafka:            ') + chalk.green(kafka));
  console.log(chalk.white('  Operaciones:      ') + chalk.green(ops));
  if (auth !== 'none') console.log(chalk.white('  Autenticación:    ') + chalk.green(auth));
  if (schemaRegistry !== 'none') console.log(chalk.white('  Schema Registry:  ') + chalk.green(schemaRegistry));
  console.log(chalk.white('  Ruta:             ') + chalk.green(path));
  console.log(chalk.white('  Skip Tests:       ') + (skipTests.toLowerCase() === 's' ? chalk.yellow('Sí') : chalk.green('No')));
  
  console.log(chalk.gray('\n  Comando: ') + chalk.cyan(command));

  const confirm = await question(chalk.yellow('\n¿Ejecutar generación? (S/n): '));
  if (confirm.toLowerCase() === 'n') {
    console.log(chalk.yellow('⚠️  Generación cancelada'));
    await question(chalk.gray('\nPresiona Enter para continuar...'));
    return;
  }

  // Ejecutar comando
  console.log(chalk.blue('\n🚀 Generando módulo...\n'));
  
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: 'inherit' });
    
    child.on('close', async (code) => {
      if (code === 0) {
        console.log(chalk.green.bold('\n✅ ¡Módulo generado exitosamente!\n'));
        console.log(chalk.cyan('📝 Próximos pasos:\n'));
        console.log(chalk.white(`  1. Revisar archivos generados en ${path}/${name}/`));
        if (database === 'oracle' || database === 'mssql') {
          console.log(chalk.white(`  2. Desplegar stored procedures desde ${path}/${name}/infra/db/`));
        }
        if (kafka !== 'none') {
          console.log(chalk.white('  3. Configurar topics de Kafka'));
        }
        console.log(chalk.white('  4. Implementar lógica de negocio en los use cases'));
        console.log(chalk.white('  5. Ejecutar tests: npm test'));
      } else {
        console.log(chalk.red.bold('\n❌ Error al generar el módulo'));
      }
      await question(chalk.gray('\nPresiona Enter para continuar...'));
      resolve();
    });
  });
}

// Función para mostrar ejemplos
async function showExamples() {
  console.clear();
  console.log(chalk.blue.bold('\n📚 EJEMPLOS DE USO\n'));
  
  console.log(chalk.cyan('1. Microservicio de Pagos con Oracle y Kafka:\n'));
  console.log(chalk.gray('   nest g @template/schematics:application payments-service'));
  console.log(chalk.gray('   cd payments-service'));
  console.log(chalk.gray('   nest g @template/schematics:hexagonal-module payments \\'));
  console.log(chalk.gray('     --database=oracle --kafka=both --auth=jwt\n'));

  console.log(chalk.cyan('2. API Gateway con MongoDB:\n'));
  console.log(chalk.gray('   nest g @template/schematics:application api-gateway'));
  console.log(chalk.gray('   cd api-gateway'));
  console.log(chalk.gray('   nest g @template/schematics:hexagonal-module users \\'));
  console.log(chalk.gray('     --database=mongodb --crud-mode=orm --auth=jwt\n'));

  console.log(chalk.cyan('3. Servicio sin Base de Datos (Proxy):\n'));
  console.log(chalk.gray('   nest g @template/schematics:application proxy-service'));
  console.log(chalk.gray('   cd proxy-service'));
  console.log(chalk.gray('   nest g @template/schematics:hexagonal-module external-api \\'));
  console.log(chalk.gray('     --database=none --kafka=none\n'));

  await question(chalk.gray('Presiona Enter para continuar...'));
}

// Función para mostrar ayuda
async function showHelp() {
  console.clear();
  console.log(chalk.blue.bold('\n📖 AYUDA Y DOCUMENTACIÓN\n'));
  
  console.log(chalk.cyan('Documentación disponible:\n'));
  console.log(chalk.white('  • README.md              ') + chalk.gray('- Documentación principal'));
  console.log(chalk.white('  • QUICKSTART.md          ') + chalk.gray('- Guía de inicio rápido'));
  console.log(chalk.white('  • TECHNICAL_MANUAL.md    ') + chalk.gray('- Manual técnico completo'));
  console.log(chalk.white('  • VALIDATION_REPORT.md   ') + chalk.gray('- Informe de validación'));
  console.log(chalk.white('  • DELIVERY_SUMMARY.md    ') + chalk.gray('- Resumen de entrega\n'));

  console.log(chalk.cyan('Comandos útiles:\n'));
  console.log(chalk.white('  nest g @template/schematics:application --help'));
  console.log(chalk.white('  nest g @template/schematics:hexagonal-module --help\n'));

  console.log(chalk.cyan('Soporte:\n'));
  console.log(chalk.white('  Email: ') + chalk.gray('desarrollofabricadigitalcapamedia@claromovilco.onmicrosoft.com'));
  console.log(chalk.white('  Equipo: ') + chalk.gray('Célula Azure - Fábrica Digital Claro\n'));

  await question(chalk.gray('Presiona Enter para continuar...'));
}

// Función principal
async function main() {
  let exit = false;

  while (!exit) {
    showMainMenu();
    const choice = await question(chalk.yellow('Selecciona una opción (1-5): '));

    switch (choice) {
      case '1':
        await generateApplication();
        break;
      case '2':
        await generateModule();
        break;
      case '3':
        await showExamples();
        break;
      case '4':
        await showHelp();
        break;
      case '5':
        console.log(chalk.green('\n👋 ¡Hasta luego!\n'));
        exit = true;
        break;
      default:
        console.log(chalk.red('\n❌ Opción inválida'));
        await question(chalk.gray('Presiona Enter para continuar...'));
    }
  }

  rl.close();
}

// Ejecutar
main().catch(console.error);
