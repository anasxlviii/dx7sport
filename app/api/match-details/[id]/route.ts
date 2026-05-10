import { NextResponse } from 'next/server';
import { getEventDetails } from '@/lib/pipeline/sportsdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const details = await getEventDetails(id);
    return NextResponse.json(details);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
