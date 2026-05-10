const axios = require('axios');

async function findGameWithGoals() {
  const API_KEY = '3';
  try {
    // 4328 is PL
    const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventspastleague.php?id=4328`);
    const events = res.data.events;
    const gameWithGoals = events.find(e => parseInt(e.intHomeScore) > 0 || parseInt(e.intAwayScore) > 0);
    
    if (gameWithGoals) {
      console.log('Testing with Event ID:', gameWithGoals.idEvent, gameWithGoals.strEvent);
      const details = await axios.get(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupevent.php?id=${gameWithGoals.idEvent}`);
      console.log(JSON.stringify(details.data.events[0], null, 2));
    } else {
      console.log('No games with goals found in last few results.');
    }
  } catch (err) {
    console.error(err);
  }
}

findGameWithGoals();
