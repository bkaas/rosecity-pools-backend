// Main query for accessing player stats
exports.getStatsQuery =
  `SELECT
    rt.name AS teamname,
    np.lastname,
    np.firstname,
    ncs.points,
    nt.logo,
    rr.round,
    rr.pick,
    nps.eliminated
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
  LEFT JOIN nhl.playoffstatus nps
    ON nt.teamid = nps.teamid
    AND ns.seasonid = nps.seasonid
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

// Query to align raw stats scraped from an external website
// to the nhl.players table
const selectNewStats =
  `SELECT
    np.playerid playerid,
    $(seasonid) seasonid,
    $(gametypeid) gametypeid,
    ts.pts::INTEGER pts,
    nt.teamid teamid,
    ts.gp::INTEGER gp
  FROM nhl.players np
  LEFT JOIN nhl.nicknames nn
    ON LOWER(np.firstname) = LOWER(nn.name)
    OR LOWER(np.firstname) = LOWER(nn.nickname)
  LEFT JOIN tmpstats ts
    ON (
      REPLACE(LOWER(CONCAT(np.firstname, ' ', np.lastname)), '.', '') = REPLACE(LOWER(ts.name), '.', '')
      OR
      REPLACE(LOWER(CONCAT(nn.name, ' ', np.lastname)), '.', '') = REPLACE(LOWER(ts.name), '.', '')
      OR
      REPLACE(LOWER(CONCAT(nn.nickname, ' ', np.lastname)), '.', '') = REPLACE(LOWER(ts.name), '.', '')
    )
    AND
      CASE WHEN np.position IN ('LW', 'RW', 'C') THEN 'F' ELSE np.position END
      =
      CASE WHEN ts.pos IN ('LW', 'RW', 'C') THEN 'F' ELSE ts.pos END
  LEFT JOIN nhl.teams nt
    ON nt.abbr = ts.abbr
  WHERE ts.pts IS NOT NULL`;

// For stats that don't already exist in nhl.cumstats, insert new ones
exports.insertStatsQuery =
  `INSERT INTO nhl.cumstats
    (playerid, seasonid, gametypeid, points, teamid, gp)
  ${selectNewStats}
  ON CONFLICT DO NOTHING;`;

// For stats that already exist in nhl.cumstats, update their values
exports.updateStatsQuery =
  `UPDATE nhl.cumstats ncs
  SET points = myq.pts, gp = myq.gp
  FROM (${selectNewStats}) AS myq
  WHERE myq.playerid = ncs.playerid
    AND myq.seasonid = ncs.seasonid
    AND myq.gametypeid = ncs.gametypeid
    AND myq.teamid = ncs.teamid;`
