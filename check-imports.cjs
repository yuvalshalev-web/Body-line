const fs = require('fs');
const path = require('path');

function checkDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(fullPath), importPath);
          // Check if file exists with exact case
          const dirName = path.dirname(resolvedPath);
          const baseName = path.basename(resolvedPath);
          
          if (fs.existsSync(dirName)) {
            const dirFiles = fs.readdirSync(dirName);
            // Try to find matching file (with or without extension)
            const exactMatch = dirFiles.find(f => f === baseName || f.startsWith(baseName + '.'));
            if (!exactMatch) {
              // Check if it exists with different case
              const caseInsensitiveMatch = dirFiles.find(f => f.toLowerCase() === baseName.toLowerCase() || f.toLowerCase().startsWith(baseName.toLowerCase() + '.'));
              if (caseInsensitiveMatch) {
                console.log(`CASE MISMATCH in ${fullPath}: imported '${importPath}', actual file is '${caseInsensitiveMatch}'`);
              }
            }
          }
        }
      }
    }
  }
}

checkDirectory('./src');
console.log('Done checking imports.');
