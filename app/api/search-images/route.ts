import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/pipeline/image-search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'Missing query' }, { status: 400 });

  try {
    const results = await searchImages(q, 9);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[SearchImages API]', err);
    return NextResponse.json({ results: [] });
  }
}
