interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  credibility: 'high' | 'medium' | 'low';
}

interface SearchResponse {
  items?: Array<{
    link: string;
    title: string;
    snippet: string;
    displayLink?: string;
  }>;
}

const CREDIBLE_SOURCES = [
  'bbc.com',
  'bbc.co.uk',
  'espn.com',
  'sky.com',
  'goal.com',
  'theathletic.com',
  'theguardian.com',
  'reuters.com',
  ' Associated Press',
  'uefa.com',
  'fifa.com',
  'premierleague.com',
  'laliga.com',
  'legaseriea.it',
  'bundesliga.com',
  'ligue1.com',
  'marca.com',
  'as.com',
  'lequipe.fr',
  'gazzetta.it',
  'kicker.de',
  'transfermarkt.com',
  'sportinglife.com',
  'nbcsports.com',
];

export interface FactCheckResult {
  query: string;
  results: SearchResult[];
  verifiedFacts: string[];
  conflictingReports: string[];
}

export async function searchGoogle(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    throw new Error('Google Search API credentials not configured');
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('cx', cx);
  url.searchParams.append('q', query);
  url.searchParams.append('num', '10');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data: SearchResponse = await response.json();

    return (data.items || []).map(item => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet,
      credibility: assessCredibility(item.link, item.displayLink || ''),
    }));
  } catch (error) {
    console.error(`Search failed for query "${query}":`, error);
    return [];
  }
}

function assessCredibility(url: string, displayLink: string): 'high' | 'medium' | 'low' {
  const domain = displayLink.toLowerCase() || new URL(url).hostname.toLowerCase();

  const isCredible = CREDIBLE_SOURCES.some(source =>
    domain.includes(source.toLowerCase())
  );

  if (isCredible) return 'high';

  // Official club domains
  if (domain.includes('.fc.') || domain.includes('official')) return 'high';

  // Well-known sports sites
  if (domain.includes('sport') || domain.includes('football') || domain.includes('soccer')) {
    return 'medium';
  }

  return 'medium';
}

export async function deepSearch(
  queries: string[],
  entities: string[]
): Promise<FactCheckResult[]> {
  const results: FactCheckResult[] = [];

  // Search for each query
  for (const query of queries) {
    const searchResults = await searchGoogle(query);

    // Also create entity-specific searches
    const entitySearches = await Promise.all(
      entities.slice(0, 2).map(entity =>
        searchGoogle(`${query} ${entity}`)
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
      conflictingReports: [], // Could add logic to detect contradictions
    });
  }

  return results;
}

export async function verifyClaim(claim: string): Promise<{
  isVerified: boolean;
  sources: SearchResult[];
  summary: string;
}> {
  const results = await searchGoogle(claim);

  // Simple verification logic - in production, use AI to analyze
  const highCredibilityCount = results.filter(r => r.credibility === 'high').length;

  return {
    isVerified: highCredibilityCount >= 2,
    sources: results,
    summary: highCredibilityCount >= 2
      ? 'Claim verified by multiple credible sources'
      : 'Claim needs more verification',
  };
}
