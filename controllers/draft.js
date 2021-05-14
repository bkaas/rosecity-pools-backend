const db = require('../databaseConnection.js');
const {
  checkLeagueExists,
  checkDraftedQuery,
  createLeague,
  createTeam,
  checkTeamExists,
  insertDraftResults
} = require("./queries/draftQueries.js");


// Need to use pgp task for chaining queries
exports.storeResults = async function(req, res, next) {

  const league = req.body.league;
  const year   = req.body.year;
  // const year   = 2020;
  const picks  = req.body.picks;
  console.log(league);
  console.log(year);

  db.task( async t => {

    // Check league exists
    const existingLeague = await t.oneOrNone(checkLeagueExists, [league]);
    const doesLeagueExist = !!existingLeague;

    // Create league if it doesn't exist
    if (!doesLeagueExist) {
      console.log(`Trying to create league "${league}".`);
      try {
        data = await t.none(createLeague, [league]);
        console.log(`Added league "${league}" to leagues.`);
      } catch (error) {
        console.log(`League "${league}" already exists!`, error);
      }
    }

    // Don't update the draft results table if this league has already drafted
    console.log(`Check if the league already drafted.`);
    data = await t.any(checkDraftedQuery, [league, year]);
    console.log(`Check draft data ${data}`);
    const alreadyDrafted = !!data.length;
    if (alreadyDrafted) {
      console.log(`The league already drafted ${alreadyDrafted}`);
      // TODO respond to the front end saying the league already exists
      return; // ?
    }

    // The league now exists and hasn't drafted

    // Add teams
    // Get unique teams
    const teams = picks.map( ({teamName}) => teamName );
    console.log(picks);
    console.log(teams);
    const uniqueTeams = teams.filter( (team, index, teams) => {
      return teams.indexOf(team) === index;
    });

    // Loop over each team
    // Use for/of loop inseatd of .forEach with await
    // Ref: https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
    console.log("Check whether teams exist");
    console.log(uniqueTeams);
    for ( const team of uniqueTeams ) {
    // uniqueTeams.forEach( team => {
      // Check team exists
      const teamResult = await t.oneOrNone(checkTeamExists, [team]);
      // Create the team if it doesn't exist
      if (!teamResult) {
        await t.none(createTeam, [team, year, league]);
        console.log(`Created team: ${team}.`);
      }
    }

    // Populate team rosters
    // Use for/of loop inseatd of .forEach with await
    for ( const {teamName, playerid, roundNo, pickNo} of picks ) {
    // picks.forEach( ({teamName, playerid, roundNo, pickNo}) => {
      await t.none(insertDraftResults, [teamName, year, league, playerid, roundNo, pickNo]);
    }

  })
    .catch(error => console.log("Error submitting draft results", error));

}