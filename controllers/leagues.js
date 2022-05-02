const db = require('../databaseConnection.js');

const query = `
  SELECT * FROM rosecity.leagues;`;

// Retrieve a list of leagues stored in the database
exports.getLeagues = function(req, res, next) {
  db.any(query)
    .then( data => {
      console.log('Got data');
      console.log(data);

      res.json(data);
    })
    .catch( error => {
      // TODO add error handling
      console.log('Did not get data.')
    });
}