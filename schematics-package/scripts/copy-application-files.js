const fs = require('fs');
const path = require('path');

const sourceRoot = path.join(__dirname, '..', '..', 'src');
const targetRoot = path.join(__dirname, '..', 'src', 'application', 'files');

// Files and directories to exclude
const excludePatterns = [
  /node_modules/,
  /dist/,
  /coverage/,
  /\.git/,
  // Exclude healthcheck module as it's a template for hexagonal-module schematic
  /src[\\\/]app[\\\/]healthcheck/,
];

// Files to copy from root
const rootFiles = [
  'package.json',
  'nest-cli.json',
  'tsconfig.json',
  'tsconfig.build.json',
  'eslint.config.mjs',
  '.prettierrc',
  '.gitignore',
  '.dockerignore',
  '.nvmrc',
  'Dockerfile',
  'commitlint.config.js',
  'sonar-project.js',
  '.env.example',
];

function shouldExclude(filePath) {
  return excludePatterns.some(pattern => pattern.test(filePath));
}

function copyFileSync(source, target) {
  const targetDir = path.dirname(target);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.copyFileSync(source, target);
}

function copyDirectoryRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (shouldExclude(sourcePath)) {
      console.log(`⏭️  Skipping: ${sourcePath}`);
      return;
    }

    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied: ${sourcePath} -> ${targetPath}`);
    }
  });
}

console.log('📦 Copying application files...\n');

// Create target directory
if (!fs.existsSync(targetRoot)) {
  fs.mkdirSync(targetRoot, { recursive: true });
}

// Copy root files
console.log('📄 Copying root configuration files...\n');
const projectRoot = path.join(__dirname, '..', '..');

rootFiles.forEach(file => {
  const sourcePath = path.join(projectRoot, file);
  const targetPath = path.join(targetRoot, file);
  
  if (fs.existsSync(sourcePath)) {
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ Copied: ${file}`);
  } else {
    console.log(`⚠️  Not found: ${file}`);
  }
});

console.log('\n📁 Copying src directory...\n');

// Copy src directory
copyDirectoryRecursive(sourceRoot, path.join(targetRoot, 'src'));

// Copy test directory
const testSource = path.join(projectRoot, 'test');
const testTarget = path.join(targetRoot, 'test');

console.log('\n🧪 Copying test directory...\n');
copyDirectoryRecursive(testSource, testTarget);

// Copy deploy directory
const deploySource = path.join(projectRoot, 'deploy');
const deployTarget = path.join(targetRoot, 'deploy');

console.log('\n🚀 Copying deploy directory...\n');
copyDirectoryRecursive(deploySource, deployTarget);

console.log('\n✅ Application files copied successfully!');
console.log(`📂 Target: ${targetRoot}\n`);
