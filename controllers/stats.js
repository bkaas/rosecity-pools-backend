const db = require('../databaseConnection.js')

// const query = 'SELECT * FROM nhl.players WHERE playerid < $1;';
const query = `SELECT np.lastname, np.firstname, ncs.points, nt.logo
FROM nhl.cumstats ncs
LEFT JOIN nhl.players np
  ON ncs.playerid = np.playerid
LEFT JOIN nhl.seasons ns
  ON ncs.seasonid = ns.seasonid
LEFT JOIN nhl.gametypes ng
  ON ncs.gametypeid = ng.gametypeid
LEFT JOIN nhl.teams nt
  ON np.teamid = nt.teamid
WHERE
  lower(ng.gametype) = 'playoffs'
  AND ns.endyear = 2020
ORDER BY ncs.points DESC;`

exports.getStats = function(req, res, next) {
  db.any(query, 30)
      .then(function(data) {
        console.log(typeof data);
        console.log('Got data.')
        // res.send(data);
        res.json(data);
      })
      .catch(function(error) {
          // TODO add error handling
          console.log('Did not get data.')
      });
};

// const getStats = async () => {
//   try {
//     const players = await db.any(query, 30);
//     console.log('Got players.')
//     return players;
//   }
//   catch(e) {
//     // error
//   }
// };