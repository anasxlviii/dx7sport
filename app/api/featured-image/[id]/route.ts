import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';


export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) return new Response('Invalid ID', { status: 400 });

  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!article || !article.featuredImage) {
    return new Response('Not Found', { status: 404 });
  }

  const img = article.featuredImage;

  // If it's a data URI (base64), parse and serve as binary
  if (img.startsWith('data:image/')) {
    try {
      const mimeMatch = img.match(/^data:([^;]+);base64,/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = img.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return new Response(buffer, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err) {
      return new Response('Error decoding image', { status: 500 });
    }
  }

  // If it's already a URL, redirect to it
  return NextResponse.redirect(img);
}
