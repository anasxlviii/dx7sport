import axios from 'axios';

const SPORTSDB_API_KEY = '3'; // Free API key for testing

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
  // European Big 5
  PREMIER_LEAGUE: '4328',
  LA_LIGA: '4335',
  SERIE_A: '4332',
  BUNDESLIGA: '4331',
  LIGUE_1: '4334',
  // European Cups
  CHAMPIONS_LEAGUE: '4401',
  EUROPA_LEAGUE: '4480',
  CONFERENCE_LEAGUE: '4966',
  // Global
  SAUDI_PRO_LEAGUE: '4668',
  MLS: '4346',
};

// Official league badge URLs from TheSportsDB
const LEAGUE_BADGES: Record<string, string> = {
  '4328': 'https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png', // Premier League
  '4335': 'https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png', // La Liga
  '4332': 'https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png', // Serie A
  '4331': 'https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png', // Bundesliga
  '4334': 'https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png', // Ligue 1
  '4401': 'https://r2.thesportsdb.com/images/media/league/badge/aofb771742983333.png', // Champions League
  '4480': 'https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png', // Europa League
  '4966': 'https://r2.thesportsdb.com/images/media/league/badge/54hu9p1664190019.png', // Conference League
  '4668': 'https://r2.thesportsdb.com/images/media/league/badge/w67i621701772123.png', // Saudi Pro League
  '4346': 'https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png', // MLS
};

/**
 * Fetches latest results for a specific league
 */
export async function getLatestResults(leagueId = TOP_LEAGUES.PREMIER_LEAGUE): Promise<SportsEvent[]> {
  // EXCLUSION: Never fetch for Israeli league
  if (leagueId === '4344') return [];
  
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventspastleague.php?id=${leagueId}`;
    const response = await axios.get(url);
    return response.data.events || [];
  } catch (error) {
    console.error('[SportsDB] Failed to fetch results:', error);
    return [];
  }
}

/**
 * Fetches scores for the top leagues (Big 5 + Cups + Global)
 * Tries to fetch today's live scores first, falls back to latest results
 */
export async function getTopLeaguesScores(): Promise<SportsEvent[]> {
  // The "featured" leagues shown in the scores section
  const featuredLeagues = [
    TOP_LEAGUES.PREMIER_LEAGUE,
    TOP_LEAGUES.LA_LIGA,
    TOP_LEAGUES.SERIE_A,
    TOP_LEAGUES.BUNDESLIGA,
    TOP_LEAGUES.LIGUE_1,
    TOP_LEAGUES.CHAMPIONS_LEAGUE,
    TOP_LEAGUES.EUROPA_LEAGUE,
    TOP_LEAGUES.CONFERENCE_LEAGUE,
    TOP_LEAGUES.SAUDI_PRO_LEAGUE,
    TOP_LEAGUES.MLS,
  ];

  try {
    // Helper to fetch for a specific date across all leagues
    const fetchForDate = async (dateStr: string) => {
      const results = await Promise.all(
        featuredLeagues.map(async (id) => {
          try {
            const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsday.php?d=${dateStr}&l=${id}`;
            const response = await axios.get(url);
            return response.data.events || [];
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    };

    const today = new Date().toISOString().split('T')[0];
    let allEvents = await fetchForDate(today);

    // SMART LOGIC: If all games today have finished, also fetch tomorrow's schedule
    const allFinished =
      allEvents.length > 0 &&
      allEvents.every(
        (e) => e.strStatus === 'Match Finished' || e.strStatus === 'FT'
      );

    if (allFinished || allEvents.length === 0) {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
      const tomorrowEvents = await fetchForDate(tomorrowStr);

      if (tomorrowEvents.length > 0) {
        allEvents = [...tomorrowEvents, ...allEvents];
      }
    }

    // Fallback to latest past results if not enough events
    if (allEvents.length < 5) {
      // Only fallback for Big 5 + UCL to avoid too many requests
      const fallbackLeagues = [
        TOP_LEAGUES.PREMIER_LEAGUE,
        TOP_LEAGUES.LA_LIGA,
        TOP_LEAGUES.SERIE_A,
        TOP_LEAGUES.BUNDESLIGA,
        TOP_LEAGUES.LIGUE_1,
        TOP_LEAGUES.CHAMPIONS_LEAGUE,
        TOP_LEAGUES.SAUDI_PRO_LEAGUE,
      ];
      const pastResults = await Promise.all(fallbackLeagues.map((id) => getLatestResults(id)));
      pastResults.forEach((events) => {
        if (events && events.length > 0) {
          allEvents.push(...events);
        }
      });
    }

    // Attach league badges & FILTER Israeli league (Safety)
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

    // Deduplicate + sort: Live first, then Scheduled, then Finished (newest first)
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

/**
 * Fetches upcoming big matches
 */
export async function getUpcomingMatches(): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnextleague.php?id=${TOP_LEAGUES.PREMIER_LEAGUE}`;
    const response = await axios.get(url);
    return response.data.events || [];
  } catch (error) {
    console.error('[SportsDB] Upcoming matches fetch failed:', error);
    return [];
  }
}

/**
 * Searches for a team ID by name
 */
export async function searchTeam(teamName: string): Promise<any> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    const response = await axios.get(url);
    return response.data.teams ? response.data.teams[0] : null;
  } catch (error) {
    console.error(`[SportsDB] Team search failed for ${teamName}:`, error);
    return null;
  }
}

/**
 * Fetches last 5 results for a specific team
 */
export async function getTeamLastResults(teamId: string): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventslast.php?id=${teamId}`;
    const response = await axios.get(url);
    return response.data.results || [];
  } catch (error) {
    console.error(`[SportsDB] Team results fetch failed for ${teamId}:`, error);
    return [];
  }
}

/**
 * Fetches next 5 fixtures for a specific team
 */
export async function getTeamNextFixtures(teamId: string): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnext.php?id=${teamId}`;
    const response = await axios.get(url);
    return response.data.events || [];
  } catch (error) {
    console.error(`[SportsDB] Team fixtures fetch failed for ${teamId}:`, error);
    return [];
  }
}

/**
 * Fetches detailed info for a specific event
 */
export async function getEventDetails(idEvent: string): Promise<any> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/lookupevent.php?id=${idEvent}`;
    const response = await axios.get(url);
    return response.data.events ? response.data.events[0] : null;
  } catch (error) {
    console.error('[SportsDB] Event details fetch failed:', error);
    return null;
  }
}
