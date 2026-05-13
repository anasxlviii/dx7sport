const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'app')).concat(walk(path.join(process.cwd(), 'components')));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("'use client'") && content.includes("export const runtime = 'edge';")) {
        // Check if runtime is before use client
        const runtimeIdx = content.indexOf("export const runtime = 'edge';");
        const useClientIdx = content.indexOf("'use client'");
        
        if (runtimeIdx < useClientIdx) {
            console.log(`Fixing directive order in ${file}`);
            // Remove runtime export
            let newContent = content.replace("export const runtime = 'edge';\n", "");
            newContent = newContent.replace("export const runtime = 'edge';", ""); // backup if no newline
            
            // Re-insert after 'use client'
            if (newContent.includes("'use client';")) {
                newContent = newContent.replace("'use client';", "'use client';\nexport const runtime = 'edge';");
            } else if (newContent.includes("'use client'")) {
                newContent = newContent.replace("'use client'", "'use client'\nexport const runtime = 'edge'");
            }
            
            fs.writeFileSync(file, newContent);
        }
    }
});
