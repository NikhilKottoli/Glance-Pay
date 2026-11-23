const fs = require('fs');
const content = fs.readFileSync('src/parser/index.ts', 'utf8');
console.log(content.substring(0, 200));