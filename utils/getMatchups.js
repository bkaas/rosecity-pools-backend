// Get matchups from nhl.com

const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const db = require("../databaseConnection.js");

// Run file:
// node -r C:\Users\bkaas\AppData\Roaming\npm\node_modules\dotenv\config .\getMatchups.js dotenv_config_path=C:\Users\bkaas\Documents\Projects\rose-city-playoff-pool\rose-city-playoff-pool\api\rose-city-pp-api\.env

const THESCORE_URL = 'https://www.thescore.com/nhl/standings/playoffs';

const updateContendersQuery =
  `UPDATE nhl.playoffstatus
    SET eliminated = true
    WHERE teamid IN (
      SELECT nps.teamid
        FROM nhl.playoffstatus nps
      LEFT JOIN nhl.teams nt
        ON nt.teamid = nps.teamid
      WHERE nt.abbr IN ($1:csv)
    )`;

(async () => {

  const res = await fetch(THESCORE_URL);
  const text = await res.text();
  const dom = await new JSDOM(text);
  const document = dom.window.document;

  const matchupNodes = document.querySelectorAll('.CardHeader__header--11_m6');

  const matchupStrings = Array.from(matchupNodes, (node) => {
    return node.childNodes[0].innerHTML;
  })

  console.log(matchupStrings);
  console.log(matchupStrings.length);

  // Select only the series that contain "defeats" in
  // the description. This is a big assumption. Also check
  // the series with "defeats" have a "4" in the series status
  const finishedSeries = matchupStrings.filter( str => {

    const foundDefeats = str.search(/defeats/) > 0;

    if (foundDefeats) {
      const games = str.match(/([0-9])-([0-9])/);
      if (!games.slice(1,3).some( val => val === '4')) {
        throw `Series string "${str}" contains the word defeats
          but doesn't have a '4' in the series score.`;
      }
    }

    return foundDefeats;
  });

  // console.log(finishedSeries);

  const losingTeamAbbr = finishedSeries.map( str => {
    return str.match(/[A-Z]+ defeats ([A-Z]+)/)[1];
  });

  // console.log(losingTeamAbbr);

  // console.log(updateContendersQuery);
  const queryResult = await db.any(updateContendersQuery, [losingTeamAbbr]);
  // console.log(queryResult);

})();

// TODO add catch for error handling