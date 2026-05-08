import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { articles, sources } from '@/lib/db/schema';
import { eq, desc, like, or, and } from 'drizzle-orm';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

// GET /api/articles - Fetch articles with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(articles);

    // Apply filters
    const conditions = [];

    if (status) {
      conditions.push(eq(articles.status, status));
    }

    if (category) {
      conditions.push(eq(articles.category, category));
    }

    if (search) {
      conditions.push(
        or(
          like(articles.title, `%${search}%`),
          like(articles.content, `%${search}%`)
        )
      );
    }

    // Build query with conditions
    let finalQuery = db.select().from(articles);

    if (conditions.length > 0) {
      // @ts-ignore - Drizzle typing issue
      finalQuery = finalQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    // Get articles with sources
    const allArticles = await finalQuery
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch sources for each article
    const articlesWithSources = await Promise.all(
      allArticles.map(async (article) => {
        const articleSources = await db
          .select()
          .from(sources)
          .where(eq(sources.articleId, article.id));

        return {
          ...article,
          sources: articleSources,
        };
      })
    );

    return NextResponse.json({
      articles: articlesWithSources,
      count: articlesWithSources.length,
    });
  } catch (error) {
    console.error('Articles GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create article manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, content, excerpt, category, status = 'draft' } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      );
    }

    const slug = slugify(title, { lower: true, strict: true });

    const [article] = await db
      .insert(articles)
      .values({
        title,
        slug,
        content,
        excerpt,
        status,
        category: category || 'news',
      })
      .returning();

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Article POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
