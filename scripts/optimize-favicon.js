const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace favicon references
content = content.replace(/\/favicon\.png\?v=4/g, '/favicon.webp?v=5');

fs.writeFileSync(filePath, content);
console.log('Updated favicon in layout.tsx');
