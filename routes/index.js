var express = require('express');
var router = express.Router();
const User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Chat', user: req.session.user });
});

// SEARCH
router.get('/search', async (req, res) => {
  const { search } = req.query;
  const searchedUsersf = await User.find({ firstName: search });
  const searchedUsersl = await User.find({ lastName: search });
  if (searchedUsersf.length === 0 && searchedUsersl.length === 0) {
    res.render('search/not-found', { title: 'Chat-search', user: req.session.user });
  } else {
    res.render('search/search', {
      title: 'Chat-search',
      user: req.session.user,
      searchedUsersf,
      searchedUsersl,
    })
  }
});

module.exports = router;
