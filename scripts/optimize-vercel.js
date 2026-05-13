const fs = require('fs');
const path = require('path');

const optimizations = {
    'app/article/[slug]/page.tsx': {
        target: /export const dynamic = 'force-dynamic';\s+export const revalidate = 0;/g,
        replacement: "export const revalidate = 3600;"
    },
    'app/page.tsx': {
        target: /export const dynamic = 'force-dynamic';\s+export const revalidate = 0;/g,
        replacement: "export const revalidate = 300;"
    },
    'app/category/[category]/page.tsx': {
        target: /export const dynamic = 'force-dynamic';\s+export const revalidate = 0;/g,
        replacement: "export const revalidate = 600;"
    },
    'app/entertainment/page.tsx': {
        target: /export const dynamic = 'force-dynamic';\s+export const revalidate = 0;/g,
        replacement: "export const revalidate = 600;"
    },
    'app/scores/page.tsx': {
        target: /export const dynamic = 'force-dynamic';\s+export const revalidate = 0;/g,
        replacement: "export const revalidate = 60;"
    }
};

for (const [relPath, opt] of Object.entries(optimizations)) {
    const fullPath = path.join(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (opt.target.test(content)) {
            console.log(`Optimizing ${relPath}`);
            const newContent = content.replace(opt.target, opt.replacement);
            fs.writeFileSync(fullPath, newContent);
        } else {
            console.log(`Target not found in ${relPath}`);
            // Fallback: try individual lines
            content = content.replace("export const dynamic = 'force-dynamic';", "// Optimized");
            content = content.replace("export const revalidate = 0;", opt.replacement);
            fs.writeFileSync(fullPath, content);
        }
    }
}
