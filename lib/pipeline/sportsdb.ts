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
 */
export async function getTopLeaguesScores(): Promise<SportsEvent[]> {
  const leagues = [
    TOP_LEAGUES.PREMIER_LEAGUE,
    TOP_LEAGUES.LA_LIGA,
    TOP_LEAGUES.SERIE_A,
    TOP_LEAGUES.BUNDESLIGA,
    TOP_LEAGUES.LIGUE_1
  ];
  
  const allEvents: SportsEvent[] = [];
  
  try {
    const results = await Promise.all(leagues.map(id => getLatestResults(id)));
    results.forEach(events => {
      // Get the top 3 most recent events from each league
      if (events && events.length > 0) {
        allEvents.push(...events.slice(0, 3));
      }
    });
    
    // Sort by timestamp descending
    return allEvents.sort((a, b) => 
      new Date(b.strTimestamp).getTime() - new Date(a.strTimestamp).getTime()
    );
  } catch (error) {
    console.error('[SportsDB] Top leagues fetch failed:', error);
    return [];
  }
}

/**
 * Fetches upcoming big matches
 */
export async function getUpcomingMatches(leagueId = TOP_LEAGUES.PREMIER_LEAGUE): Promise<SportsEvent[]> {

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnextleague.php?id=${leagueId}`;
    const response = await axios.get(url);
    return response.data.events || [];
  } catch (error) {
    console.error('[SportsDB] Failed to fetch upcoming matches:', error);
    return [];
  }
}
