import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { transfers } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(transfers).orderBy(desc(transfers.createdAt));

    if (type) {
      query = query.where(eq(transfers.transferType, type)) as any;
    }

    const allTransfers = await query.limit(limit).offset(offset);

    return NextResponse.json({ transfers: allTransfers, count: allTransfers.length });
  } catch (error) {
    console.error('[API /transfers GET] error:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers', transfers: [] }, { status: 500 });
  }
}
