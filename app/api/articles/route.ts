import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { articles, sources } from '@/lib/db/schema';
import { eq, desc, like, or, and, SQL } from 'drizzle-orm';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

// GET /api/articles — Fetch articles with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status   = searchParams.get('status');
    const category = searchParams.get('category');
    const search   = searchParams.get('search');
    const limit    = Math.min(parseInt(searchParams.get('limit')  || '50'), 100);
    const offset   = parseInt(searchParams.get('offset') || '0');

    // Build conditions array cleanly — no double-query bug
    const conditions: SQL[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(articles.status, status));
    }
    if (category) {
      conditions.push(eq(articles.category, category));
    }
    if (search && search.trim()) {
      conditions.push(
        or(
          like(articles.title,   `%${search.trim()}%`),
          like(articles.content, `%${search.trim()}%`)
        ) as SQL
      );
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

    const maxRetries = 2;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const baseQuery = db.select().from(articles);
        const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

        const allArticles = await filteredQuery
          .orderBy(desc(articles.createdAt))
          .limit(limit)
          .offset(offset);

        const articleIds = allArticles.map(a => a.id);
        const allSources = articleIds.length > 0
          ? await db.select().from(sources).where(
              articleIds.length === 1
                ? eq(sources.articleId, articleIds[0])
                : or(...articleIds.map(id => eq(sources.articleId, id))) as SQL
            )
          : [];

        const sourcesMap: Record<number, typeof allSources> = {};
        for (const src of allSources) {
          if (!sourcesMap[src.articleId]) sourcesMap[src.articleId] = [];
          sourcesMap[src.articleId].push(src);
        }

        const articlesWithSources = allArticles.map(article => ({
          ...article,
          sources: sourcesMap[article.id] || [],
        }));

        return NextResponse.json({
          articles: articlesWithSources,
          count: articlesWithSources.length,
        });
      } catch (err) {
        console.error(`[API /articles GET] error (attempt ${i + 1}):`, err);
        if (i === maxRetries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  } catch (error) {
    console.error('[API /articles GET] final error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles', articles: [] }, { status: 500 });
  }
}

// POST /api/articles — Create article manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, category, status = 'draft' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const [article] = await db
      .insert(articles)
      .values({ title, slug, content, excerpt, status, category: category || 'news' })
      .returning();

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('[API /articles POST] error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
