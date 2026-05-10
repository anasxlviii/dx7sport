const axios = require('axios');

async function test() {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328`;
  const response = await axios.get(url);
  console.log(JSON.stringify(response.data.events[0], null, 2));
}

test();
