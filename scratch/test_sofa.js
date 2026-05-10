const { search } = require('duckduckgo-search');
const axios = require('axios');

async function testSofaScoreSearch() {
  const query = 'site:sofascore.com Real Madrid vs Alaves live score';
  try {
    // We don't have a direct duckduckgo-search tool in node here easily without setup, 
    // but I can use search_web tool in the next step.
    console.log('Searching for:', query);
  } catch (err) {
    console.error(err);
  }
}

testSofaScoreSearch();
