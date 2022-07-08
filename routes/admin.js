var express = require('express');
var router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { isAdmin } = require('../auth');
const { check, validationResult } = require('express-validator');

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
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  User.updateOne({ _id: req.params.id }, { $set: { isModerator: true } }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/admin/users/${profileId}`);
    }
  });
});

// ISOLATE MODERATOR
router.post('/isolate-moderator/:id', isAdmin, async (req, res) => {
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  User.updateOne({ _id: req.params.id }, { $set: { isModerator: false } }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/admin/users/${profileId}`);
    }
  });
});

// DELETE USER
router.post('/delete/:id', isAdmin, async (req, res) => {
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  const path = './public' + profile.profileImg;
  if (profile.profileImg !== '/images/default-user-image.png') {
    fs.unlink(path, (err) => {
      if (err) {
        console.log(err);
        return;
      }
    })
  }
  User.deleteOne({ _id: profileId }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/admin/users');
    }
  });
});

// GET ADD USER PAGE === MANUALLY BY THE ADMIN ===
router.get('/add-user', isAdmin, async (req, res) => {
  let errorMessage = req.flash('error');
  res.render('admin/create-user', { title: 'Chat-users', messages: errorMessage, user: req.session.user });
});

router.post('/add-user', isAdmin, [
  check('firstName')
    .not().isEmpty().withMessage('please enter your first name')
    .isLength({ min: 3, max: 20 }).withMessage('first name must be between 3 and 20 characters')
    .not().matches(/\d/)
    .withMessage('first name can not contain a number'),
  check('lastName')
    .not().isEmpty().withMessage('please enter your last name')
    .isLength({ min: 3, max: 20 }).withMessage('last name must be between 3 and 20 characters')
    .not().matches(/\d/)
    .withMessage('last name can not contain a number'),
  check('email')
    .not().isEmpty().withMessage('please enter your email')
    .isEmail().withMessage('please enter a valid email'),
  check('password')
    .not().isEmpty().withMessage('please enter your password')
    .isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  check('password-confirm').custom((value, {req}) => {
    if (value !== req.body.password) {
      throw new Error("passwrod and confirm passwrod doesn't match");
    }
    return true;
  })
], (req, res, next) => {
  const errors = validationResult(req);
  if (! errors.isEmpty()) {
    var validationErrors = [];
    for(var i = 0; i < errors.errors.length; i++) {
      validationErrors.push(errors.errors[i].msg);
    }
    req.flash('error', validationErrors);
    res.redirect('add-user');
    return;
  }
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password:  new User().hashPassword(req.body.password),
    gender: req.body.gender
  });
  User.findOne({email: req.body.email}, (err, result) => {
    if (err) {
      console.log(err);
    }
    if (result) {
      req.flash('error', 'this email is already exist');
      res.redirect('add-user');
      return;
    } else {
      user.save((error, data) => {
        if (error) {
          console.log(error);
        }
        res.redirect('/admin/users');
      });
    }
  });
});

module.exports = router;
