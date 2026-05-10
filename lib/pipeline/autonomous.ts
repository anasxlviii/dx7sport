import { getLatestResults } from './sportsdb';
import { duckduckgoSearch } from './deep-search';
import { runPipeline } from './pipeline';
import { db } from '../db/db';
import { articles } from '../db/schema';
import { eq, like } from 'drizzle-orm';

/**
 * The Ghost Reporter: Autonomously finds and posts news
 */
export async function runAutonomousGhost() {
  console.log('[Ghost Reporter] Starting autonomous run...');
  
  const results: any[] = [];
  
  // 1. Data Source: Major League Results (SportsDB)
  // We'll check Premier League (4328) and La Liga (4335)
  const leagues = ['4328', '4335'];
  
  for (const leagueId of leagues) {
    const matchEvents = await getLatestResults(leagueId);
    
    // Pick the most recent big match (Top 1)
    if (matchEvents && matchEvents.length > 0) {
      const match = matchEvents[0];
      const matchTopic = `نتيجة مباراة ${match.strEvent}: ${match.intHomeScore} - ${match.intAwayScore} في الدوري ${match.strLeague === 'English Premier League' ? 'الإنجليزي' : 'الإسباني'}`;
      
      // Check if already posted
      const exists = await db.query.articles.findFirst({
        where: like(articles.title, `%${match.strEvent}%`)
      });
      
      if (!exists) {
        console.log(`[Ghost Reporter] Posting match result: ${match.strEvent}`);
        const pipelineResult = await runPipeline({
          postContent: matchTopic,
          postUrl: match.strThumb
        });
        results.push({ type: 'match', topic: match.strEvent, success: pipelineResult.success });
      }
    }
  }

  // 2. Data Source: Trending News (DuckDuckGo)
  const searchQueries = [
    'latest football transfer news mbappe real madrid',
    'اخبار كرة القدم العالمية اليوم'
  ];

  for (const query of searchQueries) {
    const searchContent = await duckduckgoSearch(query);
    
    if (searchContent) {
      // Feed the search results to the pipeline
      // The pipeline's extractTopic will figure out what the "Hottest" news is
      const pipelineResult = await runPipeline({
        postContent: `Trending Football News Search Results:\n${searchContent}`
      });
      results.push({ type: 'search', query, success: pipelineResult.success });
    }
  }

  return results;
}
