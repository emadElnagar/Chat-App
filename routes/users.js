var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const { isNotAuth } = require('../auth');
const User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', isNotAuth, (req, res) => {
  let errorMessage = req.flash('error');
  res.render('user/register.ejs', {title: 'Chat', messages: errorMessage});
});

router.post('/register', isNotAuth, [
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
    res.redirect('register');
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
      res.redirect('register');
      return;
    } else {
      user.save((error, data) => {
        if (error) {
          console.log(error);
        }
        // AUTOMATICALLY LOGIN AFTER REGISTRATION
        loggedin = req.session;
        loggedin.user = {};
        loggedin.user.email = req.body.email;
        loggedin.user._id = user._id;
        loggedin.user.firstName = user.firstName;
        loggedin.user.lastName = user.lastName;
        loggedin.user.gender = user.gender;
        loggedin.user.isAdmin = user.isAdmin;
        loggedin.user.image = user.profileImg;
        res.redirect('/');
      });
    }
  });
});

router.get('/login', isNotAuth, (req, res) => {
  let errorMessage = req.flash('loginError');
  res.render('user/login.ejs', {title: 'Chat', messages: errorMessage});
});

router.post('/login', isNotAuth, async (req, res, next)=> {
  const user = await User.findOne({ email: req.body.email });
  const loginError = "wrong email or password";
  const nextPage = req.query.next;
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
  loggedin = req.session;
  loggedin.user = {};
  loggedin.user.email = req.body.email;
  loggedin.user._id = user._id;
  loggedin.user.firstName = user.firstName;
  loggedin.user.lastName = user.lastName;
  loggedin.user.gender = user.gender;
  loggedin.user.isAdmin = user.isAdmin;
  loggedin.user.image = user.profileImg;
  if(nextPage === undefined) {
    res.redirect('/');
  } else {
    res.redirect(nextPage);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/');
  });
});

router.get('/profile/:id', async(req, res, next) => {
  const userId = req.params.id;
  const profile = await User.findById(userId);
  const errorMessage = req.flash('profileError');
  const passworderrorMessage = req.flash('changePasswordError');
  const changeEmailError = req.flash('changeEmailError')
  const successMessage = req.flash('success');
  const changeUserNameError = req.flash('changeUserNameError')
  if (!profile) {
    res.render('404', { title: 'Chat-profile', user: req.session.user });
    return;
  }
  res.render('user/profile', {
    title: 'Chat-profile',
    user: req.session.user,
    message: errorMessage,
    passworderrorMessage: passworderrorMessage,
    successMessage: successMessage,
    changeEmailError: changeEmailError,
    changeUserNameError: changeUserNameError,
    profile: {
      id: profile._id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      gender: profile.gender,
      image: profile.profileImg,
      isAdmin: profile.isAdmin,
      createdAt: profile.createdAt.toDateString()
    },
    isProfileOwner: function () {
      if (req.session.user) {
        return req.session.user._id === req.params.id;
      } else {
        return false;
      }
    }
  });
});

module.exports = router;
