// Utility script to update the database stats

const fetch  = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const {updateDatabaseWithStats} = require("./insertStats.js");

let document;
let currPageStats;
// fantrax always shows the last page of stats
// regardless how large the page number is in the URL
const allPageStats = [];

let pageNo = 0;
let lastPage = false;

(async () => {

  while (!lastPage) {
    pageNo += 1;

    const FANTRAX_URL = `https://www.fantrax.com/newui/NHL/statsPlayers.go?isSubmit=y&sId=&sortOrder=SCORING_CATEGORY&sortScId=2190&prevPageNumber=1&pageNumber=${pageNo}&season=31c&confDivOrTeamId=0&maxResultsPerPage=50&scKind=SKATING_STANDARD&position=-2`;
    const res = await fetch(FANTRAX_URL);
    const text = await res.text();
    const dom = await new JSDOM(text);
    document = dom.window.document;

    // Loop over each row of the stats table
    const statRows = document.querySelectorAll("table.sportsTable tr");

    currPageStats = Array.from(statRows, (row) => {

      const nameHtml = ((row || {}).childNodes[3] || {}).innerHTML;

      return ({
        name: (((row || {}).childNodes[5] || {}).childNodes[0] || {}).innerHTML,
        abbr: (((row || {}).childNodes[5] || {}).childNodes[2] || {}).innerHTML,
        pos:  ((row || {}).childNodes[3] || {}).innerHTML,
        gp:   ((row || {}).childNodes[7] || {}).innerHTML,
        pts:  ((row || {}).childNodes[13] || {}).innerHTML,
      });
    });

    if ( JSON.stringify(allPageStats[allPageStats.length - 1]) === JSON.stringify(currPageStats) ) {
      // Repeating data, must be on the last page
      lastPage = true;
      console.log(`Repeating data on page number ${pageNo}`);
    }
    else {
      allPageStats.push(currPageStats);
    }

    console.log(`Page number ${pageNo} complete.`)
  }

  // Flatten allPageStats array
  const allPageStatsFlat = [].concat.apply([], allPageStats);
  console.log(allPageStatsFlat);

  updateDatabaseWithStats(allPageStatsFlat);

})();






// Output format:
// allPageStats = [page1, page2, page3, ...]
// allPageStats[0] = [statRow, statRow, statRow, ...]
// allPageStats[0][0] = {name, abbr, pos, gp, pts}
//
// allPageStats[#][0] is the first row of the table (no data)