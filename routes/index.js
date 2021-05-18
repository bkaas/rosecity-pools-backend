const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.js');
const leaguesController = require('../controllers/leagues.js');
const draftController = require('../controllers/draft.js');
const playerController = require('../controllers/players.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/stats', statsController.getStats);
router.get('/api/players', playerController.getPlayers);
router.get('/api/leagues', leaguesController.getLeagues);
// Disable the draft submission since the site wasn't ready for the draft
// Don't want users to accidentally submit new draft data
// router.post('/api/draftResults', draftController.storeResults);

module.exports = router;
