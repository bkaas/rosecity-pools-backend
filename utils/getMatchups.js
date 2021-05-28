/*
* Utility script to:
*   - grab the playoff series score from a website
*   - check for teams that have been eliminated
*   - update the database playoffstatus table with eliminated teams
*
* The purpose of updating eliminated teams is to allow the frontend to strike
* out eliminated players.
* This script is intended to be run on the server on a schedule to periodically
* update the database.
*
* In order to run standalone (ie. not with npm run script), you
* will need to include the environment variables file for the
* database credentials. Something like:
* node -r <pathToDotenvPackage>/config <pathToScript> dotenv_config_path=<pathToEnvFile>
*/

const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const db = require("../databaseConnection.js");

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