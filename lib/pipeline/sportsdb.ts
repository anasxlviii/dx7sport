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

/**
 * Fetches latest results for a specific league
 * Premier League: 4328, La Liga: 4335, Champions League: 4401
 */
export async function getLatestResults(leagueId = '4328'): Promise<SportsEvent[]> {
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
 * Fetches upcoming big matches
 */
export async function getUpcomingMatches(leagueId = '4328'): Promise<SportsEvent[]> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsnextleague.php?id=${leagueId}`;
    const response = await axios.get(url);
    return response.data.events || [];
  } catch (error) {
    console.error('[SportsDB] Failed to fetch upcoming matches:', error);
    return [];
  }
}
