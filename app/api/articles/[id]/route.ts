import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { articles, sources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import slugify from 'slugify';

// GET /api/articles/[id] - Fetch single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Fetch sources
    const articleSources = await db
      .select()
      .from(sources)
      .where(eq(sources.articleId, id));

    return NextResponse.json({
      ...article,
      sources: articleSources,
    });
  } catch (error) {
    console.error('Article GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id] - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, excerpt, status, category, featuredImage } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;

    updateData.updatedAt = new Date();

    if (status === 'published' && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const [updated] = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error('Article PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Article DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
