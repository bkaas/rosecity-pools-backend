var express = require('express');
var router = express.Router();
const statsController = require('../controllers/stats.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/stats', statsController.getStats);

module.exports = router;
