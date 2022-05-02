// players.js

const db = require('../databaseConnection.js');

const currentYear = new Date().getFullYear();

const query = `
SELECT DISTINCT np.firstname, np.lastname, nt.logo, np.playerid
FROM nhl.players np
LEFT JOIN nhl.cumstats ncs
  ON np.playerid = ncs.playerid
LEFT JOIN nhl.teams nt
  ON ncs.teamid = nt.teamid
LEFT JOIN nhl.seasons ns
  ON ns.seasonid = ncs.seasonid
WHERE ns.endyear = ${currentYear}
ORDER BY np.lastname ASC;`;

exports.getPlayers = function(req, res, next) {
  db.any(query, 30)
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        // TODO add error handling
        console.log('Did not get data.')
      });
};
