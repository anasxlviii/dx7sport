import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { pageViews } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'db not available' }, { status: 500 });
    }

    const today = new Date().toISOString().slice(0, 10);

    const [totalResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(views), 0)` })
      .from(pageViews);

    const [todayResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(views), 0)` })
      .from(pageViews)
      .where(sql`date = ${today}`);

    const bySection = await db
      .select({
        section: pageViews.section,
        views: sql<number>`COALESCE(SUM(views), 0)`,
      })
      .from(pageViews)
      .groupBy(pageViews.section)
      .orderBy(sql`COALESCE(SUM(views), 0) desc`);

    const last7Days = await db
      .select({
        date: pageViews.date,
        views: sql<number>`COALESCE(SUM(views), 0)`,
      })
      .from(pageViews)
      .where(sql`date >= ${getDateNDaysAgo(7)}`)
      .groupBy(pageViews.date)
      .orderBy(pageViews.date);

    const topPages = await db
      .select({
        path: pageViews.path,
        views: sql<number>`COALESCE(SUM(views), 0)`,
      })
      .from(pageViews)
      .groupBy(pageViews.path)
      .orderBy(sql`COALESCE(SUM(views), 0) desc`)
      .limit(10);

    return NextResponse.json({
      totalViews: totalResult?.total ?? 0,
      todayViews: todayResult?.total ?? 0,
      bySection,
      last7Days,
      topPages,
    });
  } catch (err) {
    console.error('[stats] error:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
