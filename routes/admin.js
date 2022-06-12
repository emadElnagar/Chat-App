var express = require('express');
var router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { isAdmin } = require('../auth');

// GET ADMIN LOGIN PAGE
router.get('/login', (req, res) => {
  let errorMessage = req.flash('loginError');
  if(req.session.user) {
    if (req.session.user.isAdmin) {
      res.redirect('/admin');
    } else {
      res.render('404', { title: 'Chat', user: req.session.user });
    }
  } else {
    res.render('admin/signin', { title: 'Chat-admin-login', messages: errorMessage });
  }
});
