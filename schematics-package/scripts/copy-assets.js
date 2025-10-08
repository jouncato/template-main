const fs = require('fs');
const path = require('path');

/**
 * Script to copy non-TypeScript assets to dist folder
 * Required for schematics to work properly
 */

const SOURCE_DIR = path.join(__dirname, '..', 'src');
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Files to copy from root
const ROOT_FILES = ['collection.json'];

// Function to recursively copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied: ${path.relative(process.cwd(), destPath)}`);
    }
  }
}

// Function to copy single file
function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${path.relative(process.cwd(), dest)}`);
}

console.log('📦 Copying schematic assets...\n');

// Copy collection.json from root
ROOT_FILES.forEach(file => {
  const srcPath = path.join(__dirname, '..', file);
  const destPath = path.join(DIST_DIR, file);

  if (fs.existsSync(srcPath)) {
    copyFile(srcPath, destPath);
  } else {
    console.warn(`⚠️  Warning: ${file} not found`);
  }
});

// Copy schema.json files and template directories for each schematic
const schematics = ['application', 'hexagonal-module'];

schematics.forEach(schematicName => {
  const schematicsDir = path.join(SOURCE_DIR, schematicName);
  const schematicsDistDir = path.join(DIST_DIR, schematicName);

  if (fs.existsSync(schematicsDir)) {
    console.log(`\n📁 Processing ${schematicName}...`);
    
    const schemaPath = path.join(schematicsDir, 'schema.json');
    if (fs.existsSync(schemaPath)) {
      copyFile(schemaPath, path.join(schematicsDistDir, 'schema.json'));
    }

    // Copy template files directory
    const filesDir = path.join(schematicsDir, 'files');
    if (fs.existsSync(filesDir)) {
      const filesDistDir = path.join(schematicsDistDir, 'files');
      console.log(`  Copying template files...`);
      copyDirectory(filesDir, filesDistDir);
    }
  }
});

console.log('\n✅ Asset copying completed!\n');
