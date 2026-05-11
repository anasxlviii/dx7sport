import { getLatestResults } from './sportsdb';
import { duckduckgoSearch } from './deep-search';
import { runPipeline } from './pipeline';
import { db } from '../db/db';
import { articles } from '../db/schema';
import { like } from 'drizzle-orm';

const LEAGUES = [
  { id: '4328', name: 'الإنجليزي الممتاز' },
  { id: '4335', name: 'الإسباني' },
  { id: '4332', name: 'الإيطالي' },
  { id: '4331', name: 'الألماني' },
  { id: '4334', name: 'الفرنسي' },
  { id: '4401', name: 'دوري أبطال أوروبا' },
];

const SEARCH_QUERIES = [
  'latest football transfer news 2026',
  'Champions League results 2026',
  'اخبار كرة القدم العالمية اليوم 2026',
  'football manager sacking news 2026',
  'ميسي رونالدو اخبار 2026',
];

export async function runAutonomousGhost() {
  console.log('[Ghost Reporter] Starting autonomous run...');
  const results: any[] = [];

  // 1. League match results — all Big 5 + UCL
  for (const league of LEAGUES) {
    try {
      const matchEvents = await getLatestResults(league.id);
      if (!matchEvents?.length) continue;

      const match = matchEvents[0];
      
      // EXCLUSION FILTER: Skip if match involves Israeli entities (Safety)
      const lowerTopic = match.strEvent.toLowerCase();
      const safetyKeywords = ['israel', 'maccabi', 'hapoel', 'beitar', 'tel aviv', 'haifa', 'jerusalem'];
      if (safetyKeywords.some(kw => lowerTopic.includes(kw))) {
        console.log(`[Safety] Skipping Israeli entity: ${match.strEvent}`);
        continue;
      }

      const matchTopic = `نتيجة مباراة ${match.strEvent}: ${match.intHomeScore} - ${match.intAwayScore} في ${league.name}`;
      
      const exists = await db.query.articles.findFirst({
        where: like(articles.title, `%${match.strEvent}%`),
      });

      if (!exists) {
        console.log(`[Ghost Reporter] Posting: ${match.strEvent}`);
        const pr = await runPipeline({ postContent: matchTopic, postUrl: match.strThumb });
        results.push({
          type: 'match',
          name: match.strEvent,
          success: pr.success,
          message: pr.success ? 'تم إنشاء مقال المباراة بنجاح' : pr.error || 'فشل',
          articleId: pr.article?.id,
        });
      } else {
        results.push({ type: 'match', name: match.strEvent, success: true, message: 'موجود مسبقاً' });
      }
    } catch (error) {
      results.push({ type: 'match', name: league.name, success: false, message: String(error) });
    }
  }

  // 2. Trending news search queries
  for (const query of SEARCH_QUERIES) {
    try {
      // EXCLUSION FILTER: Skip queries that might trigger Israeli content
      if (query.toLowerCase().includes('israel')) continue;

      const searchContent = await duckduckgoSearch(query);
      if (!searchContent) {
        results.push({ type: 'search', name: query, success: false, message: 'لم يتم العثور على نتائج' });
        continue;
      }

      // EXCLUSION FILTER: Skip results containing Israeli content
      if (searchContent.toLowerCase().includes('israel')) {
        results.push({ type: 'search', name: query, success: false, message: 'محتوى مستبعد (إسرائيلي)' });
        continue;
      }

      const pr = await runPipeline({ postContent: `Trending Football News:\n${searchContent}` });
      results.push({
        type: 'search',
        name: query,
        success: pr.success,
        message: pr.success ? 'تم إنشاء مقال إخباري بنجاح' : pr.error || 'فشل',
        articleId: pr.article?.id,
      });
    } catch (error) {
      results.push({ type: 'search', name: query, success: false, message: String(error) });
    }
  }

  return results;
}
