#!/usr/bin/env node

/**
 * Script para generar aplicaciones usando el schematic local sin npm link
 * Uso: node scripts/generate-local.js application <nombre> [opciones]
 */

const { NodeWorkflow } = require('@angular-devkit/schematics/tools');
const { logging } = require('@angular-devkit/core');
const path = require('path');
const fs = require('fs');

// Obtener argumentos
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Debes especificar el tipo de schematic y el nombre');
  console.log('\nUso:');
  console.log('  npm run generate:local <schematic> <nombre> [-- opciones]');
  console.log('\nSchematics disponibles:');
  console.log('  - application (alias: app)');
  console.log('  - hexagonal-module (alias: hex-module, hm)');
  console.log('\nEjemplos:');
  console.log('  npm run generate:local application my-service');
  console.log('  npm run generate:local hexagonal-module payments -- --database=oracle --kafka=producer');
  console.log('\nOpciones de application:');
  console.log('  --package-manager=<npm|yarn|pnpm>  Gestor de paquetes (default: npm)');
  console.log('  --skip-install                     No instalar dependencias');
  console.log('  --skip-git                         No inicializar git');
  console.log('\nOpciones de hexagonal-module:');
  console.log('  --database=<oracle|mssql|mongodb|none>');
  console.log('  --kafka=<none|producer|consumer|both>');
  console.log('  --crud-mode=<stored-proc|orm|mixed>');
  console.log('  --ops=<select,insert,update,delete>');
  console.log('  --auth=<none|jwt|oauth2>');
  console.log('  --path=<path>                      Ruta donde crear el módulo');
  process.exit(1);
}

const schematicType = args[0];
const schematicName = args[1];

// Parsear opciones
const options = { name: schematicName };
for (let i = 2; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    if (value === undefined) {
      options[key] = true;
    } else {
      options[key] = value;
    }
  }
}

// Path al directorio de schematics compilados
const collectionPath = path.resolve(__dirname, '..', 'dist', 'collection.json');

console.log('🚀 Generando con schematic local...');
console.log(`📦 Schematic: ${schematicType}`);
console.log(`📝 Nombre: ${schematicName}`);
console.log(`⚙️  Opciones:`, options);
console.log('');

async function runSchematic() {
  try {
    // Verificar que el collection.json existe
    if (!fs.existsSync(collectionPath)) {
      throw new Error(`No se encontró el collection.json en: ${collectionPath}\nEjecuta: npm run build`);
    }

    // Crear un logger compatible
    const logger = new logging.IndentLogger('generate-local');
    logger.subscribe((entry) => {
      const prefix = {
        info: 'ℹ️ ',
        warn: '⚠️ ',
        error: '❌',
        fatal: '💀',
        debug: '🐛',
      }[entry.level] || '';
      
      console.log(`${prefix} ${entry.message}`);
    });

    // Crear el workflow
    const workflow = new NodeWorkflow(
      process.cwd(),
      {
        force: false,
        dryRun: false,
        packageManager: options.packageManager || 'npm',
        resolvePaths: [path.dirname(collectionPath), process.cwd()],
        schemaValidation: true,
      }
    );

    // Ejecutar el schematic
    await workflow
      .execute({
        collection: collectionPath,
        schematic: schematicType,
        options: options,
        logger: logger,
      })
      .toPromise();

    console.log('\n✅ Schematic ejecutado exitosamente!');
    
    if (schematicType === 'application') {
      console.log('\n📋 Próximos pasos:');
      console.log(`   cd ${schematicName}`);
      if (!options['skip-install'] && !options.skipInstall) {
        console.log('   # Las dependencias se están instalando...');
      } else {
        console.log('   npm install');
      }
      console.log('   npm run start:dev');
    }
    
  } catch (error) {
    console.error('\n❌ Error al ejecutar el schematic:');
    console.error(error.message);
    if (error.stack) {
      console.error('\n📚 Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runSchematic();
