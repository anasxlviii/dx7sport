import { NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'db not available' }, { status: 500 });
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        date VARCHAR(10) NOT NULL,
        views INTEGER NOT NULL DEFAULT 1,
        section VARCHAR(50)
      )
    `);

    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'page_views_path_date_unique'
        ) THEN
          ALTER TABLE page_views ADD CONSTRAINT page_views_path_date_unique UNIQUE (path, date);
        END IF;
      END
      $$;
    `);

    return NextResponse.json({ ok: true, message: 'Migration applied' });
  } catch (err) {
    console.error('[migrate] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
