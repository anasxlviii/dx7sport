const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/layout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('getCachedSettings')) {
    content = content.replace("import { db } from '@/lib/db/db';", "import { db, getCachedSettings } from '@/lib/db/db';");
}

// 2. Replace getGlobalScripts
const searchPattern = /async function getGlobalScripts[\s\S]*?return \[\];\s*}/;
const replacement = `async function getGlobalScripts() {
  const settingsMap = await getCachedSettings();
  const scripts: string[] = [];
  if (settingsMap['ad_global_head_enabled'] === 'true' && settingsMap['ad_global_head']) {
    scripts.push(settingsMap['ad_global_head']);
  }
  if (settingsMap['ad_global_body_enabled'] === 'true' && settingsMap['ad_global_body']) {
    scripts.push(settingsMap['ad_global_body']);
  }
  return scripts;
}`;

if (searchPattern.test(content)) {
    console.log('Replacing getGlobalScripts in layout.tsx');
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(filePath, content);
} else {
    console.log('Could not find getGlobalScripts pattern in layout.tsx');
}
