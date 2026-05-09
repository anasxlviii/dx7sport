// API route for managing multiple images per article
// GET /api/article-images/[id] — list images
// POST /api/article-images/[id] — add image (URL or upload)
// DELETE /api/article-images/[id]?mediaId=X — delete one image

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { media, articles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { searchImages } from '@/lib/pipeline/image-search';

export const dynamic = 'force-dynamic';

// GET — list all images for an article
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const images = await db.select().from(media).where(eq(media.articleId, articleId));
  return NextResponse.json({ images });
}

// POST — add an image (by URL or by base64 upload)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const contentType = req.headers.get('content-type') || '';

  let url = '';
  let alt = '';

  if (contentType.includes('multipart/form-data')) {
    // File upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    alt = (formData.get('alt') as string) || '';

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 8MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    url = `data:${file.type};base64,${base64}`;
  } else {
    // JSON body with URL
    const body = await req.json();
    url = body.url;
    alt = body.alt || '';
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  const [inserted] = await db.insert(media).values({
    articleId,
    type: 'image',
    url,
    alt,
  }).returning();

  return NextResponse.json({ image: inserted });
}

// DELETE — remove one image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);
  const { searchParams } = new URL(req.url);
  const mediaId = parseInt(searchParams.get('mediaId') || '');

  if (isNaN(articleId) || isNaN(mediaId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await db.delete(media).where(and(eq(media.id, mediaId), eq(media.articleId, articleId)));
  return NextResponse.json({ success: true });
}
