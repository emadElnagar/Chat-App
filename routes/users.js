var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', (req, res) => {
  res.render('user/login.ejs', {title: 'Chat'});
});

router.get('/register', (req, res) => {
  res.render('user/register.ejs', {title: 'Chat'});
});

module.exports = router;
