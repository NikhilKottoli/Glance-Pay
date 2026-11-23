const fs = require('fs');
const path = require('path');
const cacheDir = path.join(__dirname, 'node_modules', '.vite');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('Cache cleared');
} else {
  console.log('No cache found');
}