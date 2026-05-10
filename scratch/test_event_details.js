const axios = require('axios');

async function testEventDetails() {
  const API_KEY = '3'; // Free key
  // We need a real event ID. Let's fetch the latest results first to get one.
  try {
    const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventspastleague.php?id=4328`);
    const eventId = res.data.events[0].idEvent;
    console.log('Testing with Event ID:', eventId);
    
    const details = await axios.get(`https://www.thesportsdb.com/api/v1/json/${API_KEY}/lookupevent.php?id=${eventId}`);
    console.log(JSON.stringify(details.data.events[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}

testEventDetails();
