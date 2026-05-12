const fs = require('fs');
const path = require('path');

const files = [
  'app/admin/article/[id]/page.tsx',
  'app/api/admin/login/route.ts',
  'app/api/article-images/[id]/route.ts',
  'app/api/articles/[id]/route.ts',
  'app/api/articles/route.ts',
  'app/api/fb-proxy/[slug]/route.ts',
  'app/api/featured-image/[id]/route.ts',
  'app/api/match-details/[id]/ai/route.ts',
  'app/api/match-details/[id]/route.ts',
  'app/api/pipeline/route.ts',
  'app/api/search-images/route.ts',
  'app/api/seed/route.ts',
  'app/api/settings/route.ts',
  'app/api/telegram/webhook/route.ts',
  'app/api/upload-image/route.ts',
  'app/article/[slug]/page.tsx',
  'app/category/[category]/page.tsx',
  'app/entertainment/[id]/page.tsx'
];

const basePath = 'd:/AI porjects/Football content/football-blog';

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes("export const runtime = 'edge'")) {
      // Find the last import line
      const lines = content.split('\n');
      let lastImportIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        lines.splice(lastImportIndex + 1, 0, "\nexport const runtime = 'edge';");
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        console.log(`Added runtime = 'edge' to ${file}`);
      } else {
        // Just prepend if no imports (unlikely)
        fs.writeFileSync(fullPath, "export const runtime = 'edge';\n\n" + content, 'utf8');
        console.log(`Prepended runtime = 'edge' to ${file}`);
      }
    } else {
      console.log(`${file} already has edge runtime configured.`);
    }
  } else {
    console.error(`File not found: ${file}`);
  }
});
