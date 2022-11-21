var express = require('express');
var uiSlider = require('nouislider');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CHI_TECH Web Services' });
});


module.exports = router;
