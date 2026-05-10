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
}



export const TOP_LEAGUES = {
  PREMIER_LEAGUE: '4328',
  LA_LIGA: '4335',
  SERIE_A: '4332',
  BUNDESLIGA: '4331',
  LIGUE_1: '4334',
  CHAMPIONS_LEAGUE: '4401'
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
 * Fetches scores for the top 5 leagues
 * Tries to fetch today's live scores first, falls back to latest results
 */
export async function getTopLeaguesScores(): Promise<SportsEvent[]> {
  const leagues = [
    TOP_LEAGUES.PREMIER_LEAGUE,
    TOP_LEAGUES.LA_LIGA,
    TOP_LEAGUES.SERIE_A,
    TOP_LEAGUES.BUNDESLIGA,
    TOP_LEAGUES.LIGUE_1
  ];
  
  try {
    // Helper to fetch for a specific date
    const fetchForDate = async (dateStr: string) => {
      const results = await Promise.all(leagues.map(async (id) => {
        try {
          const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsday.php?d=${dateStr}&l=${id}`;
          const response = await axios.get(url);
          return response.data.events || [];
        } catch {
          return [];
        }
      }));
      return results.flat();
    };

    const today = new Date().toISOString().split('T')[0];
    let allEvents = await fetchForDate(today);

    // SMART LOGIC: If all games today have finished, try tomorrow's games
    const allFinished = allEvents.length > 0 && allEvents.every(e => e.strStatus === 'Match Finished' || e.strStatus === 'FT');
    
    if (allFinished || allEvents.length === 0) {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
      const tomorrowEvents = await fetchForDate(tomorrowStr);
      
      if (tomorrowEvents.length > 0) {
        // We'll show today's finished matches AND tomorrow's matches
        // but only if we have room, otherwise prioritize tomorrow
        allEvents = [...tomorrowEvents, ...allEvents];
      }
    }

    // 2. If we still have very few events, fallback to latest past results
    if (allEvents.length < 5) {
      const pastResults = await Promise.all(leagues.map(id => getLatestResults(id)));
      pastResults.forEach(events => {
        if (events && events.length > 0) {
          allEvents.push(...events.slice(0, 3));
        }
      });
    }
    
    // Sort by status (Live first, then Scheduled, then Finished) and then by timestamp
    return allEvents
      .filter((v, i, a) => a.findIndex(t => t.idEvent === v.idEvent) === i) // Unique
      .sort((a, b) => {
        // Prioritize Live/In Progress
        const isLiveA = a.strStatus?.toLowerCase().includes('live') || a.strStatus === '1H' || a.strStatus === '2H' ? 1 : 0;
        const isLiveB = b.strStatus?.toLowerCase().includes('live') || b.strStatus === '1H' || b.strStatus === '2H' ? 1 : 0;
        if (isLiveA !== isLiveB) return isLiveB - isLiveA;

        // Then Scheduled (Next Day)
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
