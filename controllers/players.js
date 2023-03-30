const db = require('../databaseConnection.js');

const query = `
SELECT DISTINCT np.firstname, np.lastname, nt.logo, np.playerid
FROM nhl.players np
LEFT JOIN nhl.cumstats ncs
  ON np.playerid = ncs.playerid
LEFT JOIN nhl.teams nt
  ON ncs.teamid = nt.teamid
LEFT JOIN nhl.seasons ns
  ON ns.seasonid = ncs.seasonid
WHERE ns.endyear = $(currentYear)
ORDER BY np.lastname ASC;`;


// Retrieve a list of players and their logos from the database.
exports.getPlayers = function(req, res, next) {

  // Putting this in the function so it runs each time the route is called
  // Previously it would only run on compile (I think)
  // It did not update to 2023
  const currentYear = new Date().getFullYear();

  db.any(query, {currentYear})
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        // TODO add error handling
        console.log('Did not get data.')
      });
};
