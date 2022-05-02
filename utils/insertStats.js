/*
* Utility script to update the database with stats scraped from a website
* Creates a constraint free table to dump the raw data (or clears the already
* existing table for dumping the new raw data).
* Tries to insert the data into the cumulative stats table. If the entries
* already exist, update the existing entries with the new stats.
*/

const pgp = require('pg-promise')();
const db = require("../databaseConnection.js");
// const {stats} = require("./testStats.js");
const {
  getSeason,
  getGametype,
  insertStatsQuery,
  updateStatsQuery,
} = require("../controllers/queries/statsQueries.js");

const tableName = 'tmpstats';
const gametype = "playoffs";
const year = new Date().getFullYear();

// Temporary stats dump table. Didn't use an actual Postgres temporary table
// in order to aid debugging. Temporary tables only exist in the current session.
const makeTable =
  `CREATE TABLE ${tableName} (
    name varchar(255),
    abbr varchar(255),
    pos varchar(255),
    gp varchar(255),
    pts varchar(255)
  );`;

const tableExists =
  `SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE  table_name   = $(tableName)
   );`

const cs = new pgp.helpers.ColumnSet([
  'name',
  'abbr',
  'pos',
  'gp',
  'pts'
], {table: tableName});


exports.updateDatabaseWithStats = (stats) => {

  const insert = pgp.helpers.insert(stats, cs);

  db.task( async t => {

    // Get the seasonid
    const {seasonid} = await t.one(getSeason, [year]);
    // Get the gametypeid
    const {gametypeid} = await t.one(getGametype, [gametype]);
    // console.log(seasonid);
    // console.log(gametypeid);

    const {exists} = await t.one(tableExists, {tableName});

    if (exists) {
      await t.none(`TRUNCATE tmpstats`);
    }
    else {
      // Create  table
      await t.none(makeTable);
    }

    // Insert data to intermediary table
    await t.none(insert);

    // Insert data to nhl.cumstats
    // Inserts data for players that don't yet have data
    const submitResult = await t.any(insertStatsQuery, {seasonid, gametypeid});
    console.log(submitResult);

    // Update existing player's data
    const updateResult = await t.any(updateStatsQuery, {seasonid, gametypeid});
    console.log(updateResult);
  })
    .then(() => {
        console.log('success, all records inserted');
  })
    .catch(error => {
        console.log('error', error);
  });

};