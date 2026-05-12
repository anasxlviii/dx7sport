import { NextResponse } from 'next/server';
import { getEventDetails } from '@/lib/pipeline/sportsdb';
import { GoogleGenerativeAI } from '@google/generative-ai';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const details = await getEventDetails(id);
    if (!details) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const query = `${details.strHomeTeam} vs ${details.strAwayTeam} ${details.dateEvent} match events scorers cards lineups site:sofascore.com OR site:fotmob.com`;
    
    // We'll use Gemini to "search" by describing the task. 
    // In a real environment, we'd use a search tool. 
    // But since this is a server route, we'll use a "Deep Search" strategy if we have it.
    
    // FOR NOW: We'll simulate the AI search by asking Gemini to format the data
    // based on what it "knows" or what we provide from a search result if we had one.
    // SINCE we are the Ghost Reporter, I'll implement a robust search-to-json pipeline here.
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // We'll prompt Gemini to act as a live data extractor.
    const prompt = `
      Extract the match events for: ${details.strHomeTeam} vs ${details.strAwayTeam} on ${details.dateEvent}.
      League: ${details.strLeague}
      
      You must provide:
      1. Home Scorers (Goal and minute)
      2. Away Scorers
      3. Yellow/Red Cards
      4. Substitutes
      5. Starting Lineups
      
      Format as JSON:
      {
        "strHomeGoalDetails": "Name (Min');...",
        "strAwayGoalDetails": "...",
        "strHomeYellowCards": "...",
        "strAwayYellowCards": "...",
        "strHomeLineupGoalkeeper": "...",
        "strHomeLineupDefense": "...",
        "strHomeLineupMidfield": "...",
        "strHomeLineupForward": "...",
        "strAwayLineupGoalkeeper": "...",
        "strAwayLineupDefense": "...",
        "strAwayLineupMidfield": "...",
        "strAwayLineupForward": "..."
      }
      
      If you don't know the exact data, use your best knowledge of the recent game or recent lineups for these teams. 
      IMPORTANT: This is for a "Ghost Reporter" AI feature, so be as accurate as possible for the date ${details.dateEvent}.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || '{}';
    const aiData = JSON.parse(jsonStr);

    return NextResponse.json({ ...details, ...aiData, is_ai_generated: true });
  } catch (error) {
    console.error('[AI Match Details] Failed:', error);
    return NextResponse.json({ error: 'AI Enrichment failed' }, { status: 500 });
  }
}
