var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var media = path.join(__dirname, '../public/media')

/* GET home page. */
router.get('/', function(req, res, next) {
  fs.readdir(media, function (err, names) {
    if (err) return console.log(err);
    res.render('index', { title: 'Express',music: names });
  })
});

module.exports = router;
