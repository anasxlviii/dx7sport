import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { pageViews } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

function getSection(path: string): string {
  if (path === '/' || path === '') return 'home';
  const parts = path.split('/').filter(Boolean);
  return parts[0] || 'other';
}

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: false, error: 'path required' }, { status: 400 });
    }

    const date = new Date().toISOString().slice(0, 10);
    const section = getSection(path);

    if (!db) {
      return NextResponse.json({ ok: false, error: 'db not available' });
    }

    await db.insert(pageViews)
      .values({ path, date, views: 1, section })
      .onConflictDoUpdate({
        target: [pageViews.path, pageViews.date],
        set: { views: sql`${pageViews.views} + 1` },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[track] error:', err);
    return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}
