import { NextResponse } from 'next/server';
import { getEventDetails } from '@/lib/pipeline/sportsdb';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const details = await getEventDetails(id);
    
    // Check if details are truly empty for scorers/cards
    const hasData = details && (details.strHomeGoalDetails || details.strHomeYellowCards || details.strHomeLineupGoalkeeper);

    if (!hasData && details) {
      // AI ENRICHMENT: We'll try to find the SofaScore ID or details
      // Since we can't search directly in this route without a key, 
      // we'll return the basic data but with a "no_data" flag.
      // The client will then show a "Live AI Insight" button.
      return NextResponse.json({ ...details, ai_enrichment_needed: true });
    }

    return NextResponse.json(details);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
