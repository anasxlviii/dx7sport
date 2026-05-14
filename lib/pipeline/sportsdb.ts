const SPORTSDB_API_KEY = '3';
const CACHE_TTL = 30 * 60 * 1000;

const cache = new Map<string, { data: any; expiry: number }>();

function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) return Promise.resolve(cached.data as T);
  return fn().then(data => {
    cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  });
}

export interface SportsEvent {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string;
  intAwayScore: string;
  strLeague: string;
  strTimestamp: string;
  strThumb: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strStatus?: string;
  strProgress?: string;
  idLeague: string;
  strLeagueBadge?: string;
}

export const TOP_LEAGUES = {
  PREMIER_LEAGUE: '4328',
  LA_LIGA: '4335',
  SERIE_A: '4332',
  BUNDESLIGA: '4331',
  LIGUE_1: '4334',
  CHAMPIONS_LEAGUE: '4401',
  EUROPA_LEAGUE: '4480',
  CONFERENCE_LEAGUE: '4966',
  SAUDI_PRO_LEAGUE: '4668',
  MLS: '4346',
};

const LEAGUE_BADGES: Record<string, string> = {
  '4328': 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png',
  '4335': 'https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png',
  '4332': 'https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png',
  '4331': 'https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png',
  '4334': 'https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png',
  '4401': 'https://r2.thesportsdb.com/images/media/league/badge/aofb771742983333.png',
  '4480': 'https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png',
  '4966': 'https://r2.thesportsdb.com/images/media/league/badge/54hu9p1664190019.png',
  '4668': 'https://r2.thesportsdb.com/images/media/league/badge/w67i621701772123.png',
  '4346': 'https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png',
};

const FETCH_TIMEOUT = 5000;

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`SportsDB HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getLatestResults(leagueId = TOP_LEAGUES.PREMIER_LEAGUE): Promise<SportsEvent[]> {
  return withCache(`getLatestResults:${leagueId}`, () => getLatestResultsImpl(leagueId));
}

async function getLatestResultsImpl(leagueId: string): Promise<SportsEvent[]> {
  if (leagueId === '4344') return [];
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventspastleague.php?id=${leagueId}`;
    const data = await fetchJson(url);
    return data.events || [];
  } catch (error) {
    console.error('[SportsDB] Failed to fetch results:', error);
    return [];
  }
}

export async function getTopLeaguesScores(): Promise<SportsEvent[]> {
  return withCache('getTopLeaguesScores', () => getTopLeaguesScoresImpl());
}

async function getTopLeaguesScoresImpl(): Promise<SportsEvent[]> {
  const featuredLeagues = [
    TOP_LEAGUES.PREMIER_LEAGUE, TOP_LEAGUES.LA_LIGA, TOP_LEAGUES.SERIE_A,
    TOP_LEAGUES.BUNDESLIGA, TOP_LEAGUES.LIGUE_1, TOP_LEAGUES.CHAMPIONS_LEAGUE,
    TOP_LEAGUES.EUROPA_LEAGUE, TOP_LEAGUES.CONFERENCE_LEAGUE,
    TOP_LEAGUES.SAUDI_PRO_LEAGUE, TOP_LEAGUES.MLS,
  ];

  try {
    const fetchForDate = async (dateStr: string) => {
      const results = await Promise.all(
        featuredLeagues.map(async (id) => {
          try {
            const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsday.php?d=${dateStr}&l=${id}`;
            const data = await fetchJson(url);
            return data.events || [];
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    };

    const today = new Date().toISOString().split('T')[0];
    let allEvents = await fetchForDate(today);

    const allFinished =
      allEvents.length > 0 &&
      allEvents.every((e) => e.strStatus === 'Match Finished' || e.strStatus === 'FT');

    if (allFinished || allEvents.length === 0) {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
      const tomorrowEvents = await fetchForDate(tomorrowStr);
      if (tomorrowEvents.length > 0) allEvents = [...tomorrowEvents, ...allEvents];
    }

    if (allEvents.length < 5) {
      const fallbackLeagues = [
        TOP_LEAGUES.PREMIER_LEAGUE, TOP_LEAGUES.LA_LIGA, TOP_LEAGUES.SERIE_A,
        TOP_LEAGUES.BUNDESLIGA, TOP_LEAGUES.LIGUE_1, TOP_LEAGUES.CHAMPIONS_LEAGUE,
        TOP_LEAGUES.SAUDI_PRO_LEAGUE,
      ];
      const pastResults = await Promise.all(fallbackLeagues.map((id) => getLatestResults(id)));
      pastResults.forEach((events) => { if (events) allEvents.push(...events); });
    }

    allEvents = allEvents
      .filter((event) =>
        event.idLeague !== '4344' &&
        !event.strLeague?.toLowerCase().includes('israel') &&
        !event.strHomeTeam?.toLowerCase().includes('maccabi') &&
        !event.strAwayTeam?.toLowerCase().includes('maccabi') &&
        !event.strHomeTeam?.toLowerCase().includes('hapoel') &&
        !event.strAwayTeam?.toLowerCase().includes('hapoel')
      )
      .map((event) => ({
        ...event,
        strLeagueBadge: LEAGUE_BADGES[event.idLeague] || event.strLeagueBadge,
      }));

    return allEvents
      .filter((v, i, a) => a.findIndex((t) => t.idEvent === v.idEvent) === i)
      .sort((a, b) => {
        const isLive = (s: string) => ['1H', '2H', 'HT', 'LIVE', 'P2', 'P1'].includes(s?.toUpperCase());
        const isLiveA = isLive(a.strStatus) || a.strStatus?.includes("'") ? 1 : 0;
        const isLiveB = isLive(b.strStatus) || b.strStatus?.includes("'") ? 1 : 0;
        if (isLiveA !== isLiveB) return isLiveB - isLiveA;
        const isNS_A = a.strStatus === 'NS' || a.strStatus === 'Not Started' ? 1 : 0;
        const isNS_B = b.strStatus === 'NS' || b.strStatus === 'Not Started' ? 1 : 0;
        if (isNS_A !== isNS_B) return isNS_B - isNS_A;
        return new Date(b.strTimestamp).getTime() - new Date(a.strTimestamp).getTime();
      });
  } catch (error) {
    console.error('[SportsDB] Top leagues fetch failed:', error);
    return [];
  }
}

export async function getUpcomingMatches(): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnextleague.php?id=${TOP_LEAGUES.PREMIER_LEAGUE}`;
    const data = await fetchJson(url);
    return data.events || [];
  } catch (error) {
    console.error('[SportsDB] Upcoming matches fetch failed:', error);
    return [];
  }
}

export async function searchTeam(teamName: string): Promise<any> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const data = await fetchJson(url);
    return data.teams ? data.teams[0] : null;
  } catch (error) {
    console.error(`[SportsDB] Team search failed for ${teamName}:`, error);
    return null;
  }
}

export async function getTeamLastResults(teamId: string): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventslast.php?id=${teamId}`;
    const data = await fetchJson(url);
    return data.results || [];
  } catch (error) {
    console.error(`[SportsDB] Team results fetch failed for ${teamId}:`, error);
    return [];
  }
}

export async function getTeamNextFixtures(teamId: string): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnext.php?id=${teamId}`;
    const data = await fetchJson(url);
    return data.events || [];
  } catch (error) {
    console.error(`[SportsDB] Team fixtures fetch failed for ${teamId}:`, error);
    return [];
  }
}

export async function getEventDetails(idEvent: string): Promise<any> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/lookupevent.php?id=${idEvent}`;
    const data = await fetchJson(url);
    return data.events ? data.events[0] : null;
  } catch (error) {
    console.error('[SportsDB] Event details fetch failed:', error);
    return null;
  }
}
