async function checkBadges() {
  const ids = ['4328', '4335', '4332', '4331', '4334', '4401', '4668'];
  for (const id of ids) {
    try {
      const resp = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=${id}`);
      const data = await resp.json();
      if (data.leagues && data.leagues[0]) {
        console.log(`${id}: ${data.leagues[0].strBadge}`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
checkBadges();
