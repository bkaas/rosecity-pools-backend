/*
* Utility script that scrapes player stats from an external website,
* formats the stats, then calls updateDatabaseWithStats() to update
* the database.
*
* In order to run standalone (ie. not with npm run script), you
* will need to include the environment variables file for the
* database credentials. Something like:
* node -r <pathToDotenvPackage>/config <pathToScript> dotenv_config_path=<pathToEnvFile>
*/

const puppeteer = require("puppeteer");

const {updateDatabaseWithStats} = require("./insertStats.js");

const FANTRAX_URL = `https://www.fantrax.com/news/nhl/stats/players;scKindId=3010;seasonId=31k?sortKey=PT&sortDir=1`;

const allPageStats = [];
let repeatCount = 0;

const scrollInc = 450; // determined by test
let scrollVal = 0;
let scrollCounter = 0;

const abbrRegex = /[A-Z]{3}/;

(async () => {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(FANTRAX_URL);
  // Scrape page
  const content = await page.content();

  while (repeatCount < 2) {
    scrollCounter += 1;

    // Loop over each row of the stats table
    await page.waitForSelector("div.i-table__row");
    const statRows = await page.$$("div.i-table__row");
    // For testing in the browser console:
    // document.querySelectorAll('div.i-table__row')[#]

    // Skip the first row (header row)
    statRows.shift();
    const tmp = statRows.map( async (row) => {
      return ({
        name: await row.$eval(':nth-child(2) .scorer__info__name a', el => el.innerHTML),
        abbr: await row.$eval(':nth-child(2) .scorer__info__positions span:nth-child(2)', el => el.innerHTML),
        pos:  await row.$eval(':nth-child(2) .scorer__info__positions span:nth-child(1)', el => el.innerHTML),
        gp:   await row.$eval(':nth-child(4)', el => el.innerHTML),
        pts:  await row.$eval(':nth-child(7)', el => el.innerHTML),
      });
    });

    let currPageStats = await Promise.all(tmp);
    // Remove the extra characters around the team abbr: ' - <!----> FLA '
    currPageStats = currPageStats.map((val) => {
      return ({
        name: val.name,
        abbr: val.abbr.match(abbrRegex)[0],
        pos:  val.pos,
        gp:   val.gp,
        pts:  val.pts,
      });
    });

    // https://pptr.dev/guides/page-interactions
    // Scroll the div element by 650px vertically (loads more player stats)
    scrollVal += scrollInc;
    await page.locator('div.i-table').scroll({
      scrollLeft: 0,
      scrollTop: scrollVal, // determined by test
    });

    // Check if at the end of the data
    if ( JSON.stringify(allPageStats[allPageStats.length - 1]) === JSON.stringify(currPageStats) ) {
      // Repeating data, must be on the last page
      repeatCount++;
      console.log(`Repeat count: ${repeatCount}, Scroll count: ${scrollCounter}`);
    }
    else {
      console.log(currPageStats);
      allPageStats.push(currPageStats);
      repeatCount = 0;
    }

  }

  // Flatten allPageStats array
  const allPageStatsFlat = [].concat.apply([], allPageStats);

  updateDatabaseWithStats(allPageStatsFlat);

  await browser.close();

})();


// Output format:
// allPageStats = [page1, page2, page3, ...]
// allPageStats[0] = [statRow, statRow, statRow, ...]
// allPageStats[0][0] = {name, abbr, pos, gp, pts}
//
// No longer applicable:
//  allPageStats[#][0] is the first row of the table (no data)


// Example:
/*
let tmpStats = [
  {
    name: 'Aaron Ekblad',
    abbr: ' - <!----> FLA ',
    pos: 'D',
    gp: '2',
    pts: '1'
  },
  {
    name: 'John Carlson',
    abbr: ' - <!----> WSH ',
    pos: 'D',
    gp: '5',
    pts: '1'
  },
  {
    name: 'Zach Whitecloud',
    abbr: ' - <!----> VGK ',
    pos: 'D',
    gp: '6',
    pts: '1'
  },
  {
    name: 'Eric Robinson',
    abbr: ' - <!----> CAR ',
    pos: 'LW',
    gp: '5',
    pts: '1'
  },
  {
    name: 'Jalen Chatfield',
    abbr: ' - <!----> CAR ',
    pos: 'D',
    gp: '5',
    pts: '1'
  },
  {
    name: 'Ty Emberson',
    abbr: ' - <!----> EDM ',
    pos: 'D',
    gp: '6',
    pts: '0'
  },
  {
    name: 'Johnathan Kovacevic',
    abbr: ' - <!----> NJD ',
    pos: 'D',
    gp: '3',
    pts: '0'
  },
  {
    name: 'Gabriel Vilardi',
    abbr: ' - <!----> WPG ',
    pos: 'C',
    gp: '2',
    pts: '0'
  }
]
[
  {
    name: 'J.J. Moser',
    abbr: ' - <!----> TBL ',
    pos: 'D',
    gp: '5',
    pts: '0'
  },
  {
    name: 'Fabian Zetterlund',
    abbr: ' - <!----> OTT ',
    pos: 'RW',
    gp: '6',
    pts: '0'
  },
]

*/
