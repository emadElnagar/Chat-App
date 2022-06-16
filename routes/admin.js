var express = require('express');
var router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { isAdmin } = require('../auth');

// GET ADMIN MAIN PAGE
router.get('/', isAdmin, (req, res) => {
  res.render('admin/admin_main', { title: 'Chat-admin', user: req.session.user });
});

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
    res.render('admin/signin', { title: 'Chat-admin-login', messages: errorMessage, user: false });
  }
});

// ADMIN LOGIN
router.post('/login', async(req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const loginError = `you arent allowed here or wrong password or email`;
  if(!user) {
    req.flash('loginError', loginError);
    res.redirect('login');
    return;
  }
  const validate = await bcrypt.compare(req.body.password, user.password);
  if (!validate) {
    req.flash('loginError', loginError);
    res.redirect('login');
    return;
  }
  if (user.isAdmin) {
    loggedin = req.session;
    loggedin.user = {};
    loggedin.user.email = req.body.email;
    loggedin.user._id = user._id;
    loggedin.user.firstName = user.firstName;
    loggedin.user.lastName = user.lastName;
    loggedin.user.gender = user.gender;
    loggedin.user.isAdmin = user.isAdmin;
    loggedin.user.image = user.profileImg;
    res.redirect('/admin');
  } else {
    req.flash('loginError', loginError);
    res.redirect('login');
  }
});

// GET ALL USERS PAGE
router.get('/users', isAdmin, async (req, res) => {
  const users = await User.find({});
  res.render('admin/all_users', { title: 'Chat-users', allUsers: users, user: req.session.user });
});

// GET SINGLE USER PAGE
router.get('/users/:id', isAdmin, async (req, res) => {
  const profile = await User.findById(req.params.id);
  res.render('admin/single_user', { title: 'Chat-single-user', profile: profile, user: req.session.user });
});

// CREATE A MODERATOR USER
router.post('/craete-moderator/:id', isAdmin, async (req, res) => {
  const profileId = req.params.id
  const profile = await User.findById(profileId);
  User.updateOne({ _id: req.params.id }, { $set: { isModerator: true } }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/admin/users/${profileId}`);
    }
  });
});

module.exports = router;
