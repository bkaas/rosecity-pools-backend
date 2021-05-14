// exports.getStatsQuery =
//   `SELECT
//     rt.name AS teamname,
//     np.lastname,
//     np.firstname,
//     ncs.points,
//     nt.logo,
//     rr.round,
//     rr.pick
//   FROM rosecity.rosters rr
//   LEFT JOIN rosecity.teams rt
//     ON rt.teamid = rr.teamid
//   LEFT JOIN nhl.players np
//     ON np.playerid = rr.playerid
//   LEFT JOIN rosecity.leagues rl
//     ON rt.leagueid = rl.leagueid
//   LEFT JOIN nhl.cumstats ncs
//     ON ncs.playerid = np.playerid AND
//     ncs.seasonid = rt.seasonid
//   LEFT JOIN nhl.seasons ns
//     ON ns.seasonid = rt.seasonid
//   LEFT JOIN nhl.gametypes ng
//     ON ncs.gametypeid = ng.gametypeid
//   LEFT JOIN nhl.teams nt
//     ON ncs.teamid = nt.teamid
//   WHERE ns.endyear = $1
//     AND rl.name = $2
//     -- AND ng.gametype = 'playoffs'
  // ORDER BY rt.name, rr.round, rr.pick;`

exports.getStatsQuery =
  `SELECT
    rt.name AS teamname,
    np.lastname,
    np.firstname,
    ncs.points,
    nt.logo,
    rr.round,
    rr.pick
  FROM rosecity.rosters rr
  LEFT JOIN rosecity.teams rt
    ON rt.teamid = rr.teamid
  LEFT JOIN nhl.players np
    ON np.playerid = rr.playerid
  LEFT JOIN rosecity.leagues rl
    ON rt.leagueid = rl.leagueid
  LEFT JOIN nhl.seasons ns
    ON ns.seasonid = rt.seasonid
  LEFT JOIN nhl.cumstats ncs
    ON ncs.playerid = np.playerid
    AND ncs.seasonid = ns.seasonid
  LEFT JOIN nhl.gametypes ng
    ON ncs.gametypeid = ng.gametypeid
  LEFT JOIN nhl.teams nt
    ON ncs.teamid = nt.teamid
  WHERE ns.endyear = $1
    AND rl.name = $2
  ORDER BY rt.name, rr.round, rr.pick;`