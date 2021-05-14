

exports.checkLeagueExists =
  `SELECT *
  FROM rosecity.leagues
  WHERE name = $1;`;

exports.checkTeamExists =
  `SELECT *
  FROM rosecity.teams
  WHERE name = $1`;

// Check if the league has already drafted this
exports.checkDraftedQuery =
  `SELECT *
  FROM rosecity.rosters rcr
  LEFT JOIN rosecity.teams rct
    ON rcr.teamid = rct.teamid
  LEFT JOIN rosecity.leagues rcl
    ON rct.leagueid = rcl.leagueid
  LEFT JOIN nhl.seasons ns
    ON rct.seasonid = ns.seasonid
  WHERE rcl.name = $1
    AND ns.endyear = $2;`;

exports.createLeague =
  `INSERT INTO rosecity.leagues (name)
  VALUES ($1);`


// args: team name, season end year, league name
exports.createTeam =
  `INSERT INTO rosecity.teams (name, seasonid, leagueid)
  SELECT
    $1,
    (
      SELECT seasonid
      FROM nhl.seasons
      WHERE endyear = $2
    ),
    (
      SELECT leagueid
      FROM rosecity.leagues
      WHERE name = $3
    )
  `

// args team name, season end year, league name, playerid, round, pick
exports.insertDraftResults =
  `INSERT INTO rosecity.rosters (teamid, playerid, round, pick)
  SELECT
  (
    SELECT rct.teamid
    FROM rosecity.teams rct
    LEFT JOIN nhl.seasons ns
      ON rct.seasonid = ns.seasonid
    LEFT JOIN rosecity.leagues rcl
      ON rct.leagueid = rcl.leagueid
    WHERE rct.name = $1
    AND ns.endyear = $2
    AND rcl.name = $3
  ),
  $4, $5, $6
  `