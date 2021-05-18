const db = require('../databaseConnection.js');

const {getStatsQuery} = require("./queries/statsQueries.js")

exports.getStats = function(req, res, next) {
  db.any(getStatsQuery, [2021, 'Rose City', 'playoffs'])
      .then(function(data) {
        // console.log(typeof data);
        console.log('Got data.');
        // console.log(data);

        // Data example:
        // [
        //   {
        //     teamname: 'testTeam',
        //     lastname: 'CROSBY',
        //     firstname: 'SIDNEY',
        //     points: 56,
        //     logo: 'pittsburgh.svg',
        //     round: 1,
        //     pick: 1
        //   },
        //   {
        //     teamname: 'testTeam',
        //     lastname: 'MCDAVID',
        //     firstname: 'CONNOR',
        //     points: 84,
        //     logo: 'edmonton.svg',
        //     round: 2,
        //     pick: 1
        //   }
        // ]

        // Get all returned team names
        const teams = data.map( ({teamname}) => teamname );
        // Get unique team names
        const uniqueTeams = teams.filter( (team, index, teams) => {
          return teams.indexOf(team) === index;
        });

        // Data to be sent to front end
        const outData = [];
        // Format:
        // [
        //   {
        //     name: teamname
        //     stats: [{
        //       lastname:  lastname,
        //       firstname: firstname,
        //       points:    points,
        //       logo:      logo,
        //     },
        //     {
        //       lastname:  lastname,
        //       firstname: firstname,
        //       points:    points,
        //       logo:      logo,
        //     }]
        //   },
        // ]

        // Pull stats for each team into one array
        uniqueTeams.forEach( teamName => {

          // Get picks corresponding to the current team name
          const teamPicks = data.filter( pick => {
            return pick.teamname === teamName;
          });

          // Pull out only the relevant data per team
          const stats = teamPicks.map( ({lastname, firstname, points, logo}) => {
            return {lastname, firstname, points, logo};
          });

          outData.push({
            name: teamName,
            stats,
          })

        });

        // res.send(data);
        res.json(outData);
      })
      .catch(function(error) {
        // TODO add error handling
        console.log('Did not get data.', error)
      });
};