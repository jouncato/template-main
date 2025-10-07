const fs = require('fs');
const path = require('path');

function renameFilesRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      renameFilesRecursively(fullPath);
    } else if (entry.name.includes('__moduleName__')) {
      const newName = entry.name.replace(/__moduleName__/g, '__name__');
      const newPath = path.join(dir, newName);
      fs.renameSync(fullPath, newPath);
      console.log(`Renamed: ${entry.name} → ${newName}`);
    }
  }
}

const filesDir = path.join(__dirname, '..', 'src', 'hexagonal-module', 'files');
console.log('🔄 Renaming template files...\n');
renameFilesRecursively(filesDir);
console.log('\n✅ Done!');
