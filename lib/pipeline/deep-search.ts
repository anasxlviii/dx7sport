import { search } from 'duckduckgo-search';

interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  credibility: 'high' | 'medium' | 'low';
}

const CREDIBLE_SOURCES = [
  'bbc.com', 'bbc.co.uk', 'espn.com', 'sky.com', 'goal.com',
  'theathletic.com', 'theguardian.com', 'reuters.com',
  'uefa.com', 'fifa.com', 'premierleague.com', 'laliga.com',
  'legaseriea.it', 'bundesliga.com', 'ligue1.com',
  'marca.com', 'as.com', 'lequipe.fr', 'gazzetta.it',
  'kicker.de', 'transfermarkt.com', 'sportinglife.com',
  'nbcsports.com', 'cnn.com', 'foxsports.com',
];

export interface FactCheckResult {
  query: string;
  results: SearchResult[];
  verifiedFacts: string[];
  conflictingReports: string[];
}

export async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const results = await search(query, {
      region: 'wt-wt',
      safeSearch: 'moderate',
    });

    // DuckDuckGo returns different format, let's normalize it
    return (results || []).slice(0, 10).map((result: any) => ({
      url: result.url || result.link || '',
      title: result.title || result.text || '',
      snippet: result.description || result.body || result.snippet || '',
      credibility: assessCredibility(result.url || result.link || ''),
    }));
  } catch (error) {
    console.error(`DuckDuckGo search failed for "${query}":`, error);
    return [];
  }
}

function assessCredibility(url: string): 'high' | 'medium' | 'low' {
  if (!url) return 'low';

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    const isCredible = CREDIBLE_SOURCES.some(source =>
      hostname.includes(source.toLowerCase())
    );

    if (isCredible) return 'high';

    // Official club domains
    if (hostname.includes('.fc.') || hostname.includes('official')) return 'high';

    // Well-known sports sites
    if (hostname.includes('sport') || hostname.includes('football') ||
        hostname.includes('soccer')) {
      return 'medium';
    }

    return 'medium';
  } catch {
    return 'low';
  }
}

export async function deepSearch(
  queries: string[],
  entities: string[]
): Promise<FactCheckResult[]> {
  const results: FactCheckResult[] = [];

  // Search for each query
  for (const query of queries) {
    const searchResults = await searchDuckDuckGo(query);

    // Also create entity-specific searches
    const entitySearches = await Promise.all(
      entities.slice(0, 2).map(entity =>
        searchDuckDuckGo(`${query} ${entity}`)
      )
    );

    const allResults = [...searchResults, ...entitySearches.flat()];

    // Extract verified facts from high-credibility sources
    const verifiedFacts = allResults
      .filter(r => r.credibility === 'high')
      .map(r => r.snippet)
      .slice(0, 3);

    results.push({
      query,
      results: allResults.slice(0, 10),
      verifiedFacts,
      conflictingReports: [],
    });
  }

  return results;
}

export async function verifyClaim(claim: string): Promise<{
  isVerified: boolean;
  sources: SearchResult[];
  summary: string;
}> {
  const results = await searchDuckDuckGo(claim);

  const highCredibilityCount = results.filter(r => r.credibility === 'high').length;

  return {
    isVerified: highCredibilityCount >= 2,
    sources: results,
    summary: highCredibilityCount >= 2
      ? 'Claim verified by multiple credible sources'
      : 'Claim needs more verification',
  };
}
