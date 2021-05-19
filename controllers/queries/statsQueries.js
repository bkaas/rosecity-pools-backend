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
    AND ng.gametype = $3
  ORDER BY rt.name, rr.round, rr.pick;`

exports.getSeason =
  `SELECT seasonid
  FROM nhl.seasons
  WHERE endyear = $1;`

exports.getGametype =
  `SELECT gametypeid
  FROM nhl.gametypes
  WHERE gametype = $1;`


// TODO merge common parts of the below two queries
exports.insertStatsQuery =
  `INSERT INTO nhl.cumstats
    (playerid, seasonid, gametypeid, points, teamid, gp)
  SELECT
    np.playerid,
    $1,
    $2,
    ts.pts::INTEGER,
    nt.teamid,
    ts.gp::INTEGER
  FROM tmpstats ts
  INNER JOIN nhl.players np
    ON LOWER(CONCAT(np.firstname, ' ', np.lastname)) = LOWER(ts.name)
    AND
      CASE WHEN np.position IN ('LW', 'RW', 'C') THEN 'F' ELSE np.position END
      =
      CASE WHEN ts.pos IN ('LW', 'RW', 'C') THEN 'F' ELSE ts.pos END
  LEFT JOIN nhl.teams nt
    ON nt.abbr = ts.abbr
  ON CONFLICT DO NOTHING;`;

// TODO merge common parts of the below two queries
exports.updateStatsQuery =
  `UPDATE nhl.cumstats ncs
  SET points = myq.pts, gp = myq.gp
  FROM (
    SELECT
      np.playerid playerid,
      $1 seasonid,
      $2 gametypeid,
      ts.pts::INTEGER pts,
      nt.teamid teamid,
      ts.gp::INTEGER gp
    FROM tmpstats ts
    INNER JOIN nhl.players np
      ON LOWER(CONCAT(np.firstname, ' ', np.lastname)) = LOWER(ts.name)
      AND np.position = ts.pos
    LEFT JOIN nhl.teams nt
      ON nt.abbr = ts.abbr
  ) AS myq
  WHERE myq.playerid = ncs.playerid
    AND myq.seasonid = ncs.seasonid
    AND myq.gametypeid = ncs.gametypeid
    AND myq.teamid = ncs.teamid;`
