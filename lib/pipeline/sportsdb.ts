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
  SAUDI_PRO_LEAGUE: '4952',
  MLS: '4346',
};

// Official league badge URLs from TheSportsDB
const LEAGUE_BADGES: Record<string, string> = {
  '4328': 'https://www.thesportsdb.com/images/media/league/badge/7j96f21530187061.png', // Premier League
  '4335': 'https://www.thesportsdb.com/images/media/league/badge/7on77v1546454076.png', // La Liga
  '4332': 'https://www.thesportsdb.com/images/media/league/badge/0037zh1565038478.png', // Serie A
  '4331': 'https://www.thesportsdb.com/images/media/league/badge/06v3961565038435.png', // Bundesliga
  '4334': 'https://www.thesportsdb.com/images/media/league/badge/8o56251565038531.png', // Ligue 1
  '4401': 'https://www.thesportsdb.com/images/media/league/badge/460s5a1532431620.png', // Champions League
  '4480': 'https://www.thesportsdb.com/images/media/league/badge/s2v0ru1549984867.png', // Europa League
  '4966': 'https://www.thesportsdb.com/images/media/league/badge/zy38001640870819.png', // Conference League
  '4952': 'https://www.thesportsdb.com/images/media/league/badge/ijjb021682408399.png', // Saudi Pro League
  '4346': 'https://www.thesportsdb.com/images/media/league/badge/o2nm6a1549984764.png', // MLS
};

/**
 * Fetches latest results for a specific league
 */
export async function getLatestResults(leagueId = TOP_LEAGUES.PREMIER_LEAGUE): Promise<SportsEvent[]> {
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
      ];
      const pastResults = await Promise.all(fallbackLeagues.map((id) => getLatestResults(id)));
      pastResults.forEach((events) => {
        if (events && events.length > 0) {
          allEvents.push(...events);
        }
      });
    }

    // Attach league badges
    allEvents = allEvents.map((event) => ({
      ...event,
      strLeagueBadge: LEAGUE_BADGES[event.idLeague] || event.strLeagueBadge,
    }));

    // Deduplicate + sort: Live first, then Scheduled, then Finished (newest first)
    return allEvents
      .filter((v, i, a) => a.findIndex((t) => t.idEvent === v.idEvent) === i)
      .sort((a, b) => {
        const isLiveA =
          a.strStatus?.toLowerCase().includes('live') ||
          a.strStatus === '1H' ||
          a.strStatus === '2H'
            ? 1
            : 0;
        const isLiveB =
          b.strStatus?.toLowerCase().includes('live') ||
          b.strStatus === '1H' ||
          b.strStatus === '2H'
            ? 1
            : 0;
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
