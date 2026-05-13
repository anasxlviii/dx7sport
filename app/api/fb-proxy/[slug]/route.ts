export const runtime = 'edge';
import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const article = await db.query.articles.findFirst({
    where: eq(articles.slug, slug),
    with: {
      images: true
    }
  });

  if (!article) return new Response('Not Found', { status: 404 });

  const imageUrl = `https://dx7sport.com/api/featured-image/${article.id}`;
  const articleUrl = `https://dx7sport.com/article/${article.slug}`;

  // This is a FLAT, RAW HTML response designed specifically for Facebook's crawler.
  // It bypasses all Next.js layouts, hydration, and complex scripts that trigger 403s.
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="utf-8">
    <title>${article.title}</title>
    <meta name="description" content="${article.excerpt || ''}">
    <link rel="canonical" href="${articleUrl}">
    
    <meta property="og:title" content="${article.title}">
    <meta property="og:description" content="${article.excerpt || ''}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="DX7 SPORT">
    <meta property="og:locale" content="ar_EG">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.title}">
    <meta name="twitter:description" content="${article.excerpt || ''}">
    <meta name="twitter:image" content="${imageUrl}">
</head>
<body>
    <h1>${article.title}</h1>
    <p>${article.excerpt}</p>
    <div>${article.content.substring(0, 1000)}</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-FB-Proxy': 'true'
    }
  });
}
