const fs = require('fs');
const path = require('path');

const optimizations = [
    {
        file: 'app/category/[category]/page.tsx',
        target: /\.select\(\)\s+\.from\(articlesTable\)/g,
        replacement: ".select({ id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug, excerpt: articlesTable.excerpt, featuredImage: articlesTable.featuredImage, category: articlesTable.category, status: articlesTable.status, publishedAt: articlesTable.publishedAt, createdAt: articlesTable.createdAt }).from(articlesTable)"
    },
    {
        file: 'app/entertainment/page.tsx',
        target: /\.select\(\)\s+\.from\(articlesTable\)/g,
        replacement: ".select({ id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug, excerpt: articlesTable.excerpt, featuredImage: articlesTable.featuredImage, category: articlesTable.category, status: articlesTable.status, publishedAt: articlesTable.publishedAt, createdAt: articlesTable.createdAt }).from(articlesTable)"
    }
];

optimizations.forEach(opt => {
    const fullPath = path.join(process.cwd(), opt.file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (opt.target.test(content)) {
            console.log(`Optimizing payload in ${opt.file}`);
            const newContent = content.replace(opt.target, opt.replacement);
            fs.writeFileSync(fullPath, newContent);
        } else {
            console.log(`Target not found in ${opt.file}`);
        }
    }
});
