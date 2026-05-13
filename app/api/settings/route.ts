import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';



export const dynamic = 'force-dynamic';

// Ensure the settings table exists (run once on cold start)
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  try {
    // Try a simple read — if it fails the table probably doesn't exist
    await db.select().from(settings).limit(1);
    tableReady = true;
  } catch {
    // Create the table inline
    try {
      const { sql } = await import('drizzle-orm');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) NOT NULL UNIQUE,
          value TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      tableReady = true;
    } catch (err) {
      console.error('[settings] Could not create table', err);
    }
  }
}

export async function GET() {
  await ensureTable();
  try {
    const rows = await db.select().from(settings);
    const result: Record<string, string> = {};
    for (const row of rows) result[row.key] = row.value ?? '';
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /settings GET]', error);
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  await ensureTable();
  try {
    const body: Record<string, string> = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /settings POST]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
