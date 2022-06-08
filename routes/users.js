var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');
const { isAuth, isNotAuth } = require('../auth');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/user');

const fileFilter = function(req, file, cb) {
  if (file.mimetype !== 'image/png') {
    cb(null, true)
  } else if (file.mimetype !== 'image/jpg') {
    cb(null, true)
  } else {
    cb(new Error('please enter jpg or png image'), false)
  }
}

const storage = multer.diskStorage({
  destination:  function(req, file, cb) {
    cb(null, './public/media/profile')
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toDateString() + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024*1024*5
  },
  fileFilter: fileFilter
});

router.use(upload.single('image'), (err, req, res, next) => {
  if (err) {
    req.flash('profileError', [err.message]);
    res.redirect(`profile/${req.session.user._id}`);
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// GET USER REGISTRATION PAGE
router.get('/register', isNotAuth, (req, res) => {
  let errorMessage = req.flash('error');
  res.render('user/register.ejs', {title: 'Chat', messages: errorMessage, user: false});
});

// USER REGISTER
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

// GET LOGIN PAGE
router.get('/login', isNotAuth, (req, res) => {
  let errorMessage = req.flash('loginError');
  res.render('user/login.ejs', {title: 'Chat', messages: errorMessage, user: false});
});

// USER LOGIN
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

// USER LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/');
  });
});

// GET USER PROFILE PAGE
router.get('/profile/:id', async(req, res, next) => {
  const userId = req.params.id;
  const profile = await User.findById(userId);
  if (!profile) {
    res.render('404', { title: 'Chat-profile', user: req.session.user });
    return;
  }
  const changeUserNameError = req.flash('changeUserNameError');
  const successMessage = req.flash('success');
  const changeEmailError = req.flash('changeEmailError');
  const changePasswordError = req.flash('changePasswordError');
  const isFriend = () => {
    if (req.session.user) {
      const friendRequests = profile.friends.find(friend => friend.id === req.session.user._id);
      return friendRequests != undefined;
    }
  }
  const isRequestSent = () => {
    if (req.session.user) {
      const friendRequests = profile.sentRequests.find(friend => friend.id === req.session.user._id);
      return friendRequests != undefined;
    }
  }
  const isHasRequested = () => {
    if (req.session.user) {
      const friendRequests = profile.friendRequests.find(friend => friend.id === req.session.user._id);
      return friendRequests != undefined;
    }
  }
  res.render('user/profile', {
    title: 'Chat-profile',
    user: req.session.user,
    profile: profile,
    changeUserNameError: changeUserNameError,
    successMessage: successMessage,
    changeEmailError: changeEmailError,
    changePasswordError: changePasswordError,
    isFriend: isFriend(),
    isRequestSent: isRequestSent(),
    isHasRequested: isHasRequested()
  });
});

// UPLOAD PROFILE IMAGE
router.post('/profile-img-upload', async(req, res, next) => {
  const user = req.session.user;
  const newUser = { profileImg: (req.file.path).slice(6) };
  const userId = req.session.user._id;
  const profile = await User.findById(userId);
  const path = './public' + profile.profileImg;
  if (profile.profileImg !== '/images/default-user-image.png') {
    fs.unlink(path, (err) => {
      if (err) {
        req.flash('profileError', [err.message]);
        res.redirect(`profile/${req.session.user._id}`);
        return;
      }
    })
  }
  User.updateOne({ _id: req.session.user._id }, { $set: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      req.session.user.image = newUser.profileImg;
      res.redirect(`profile/${user._id}`);
    }
  });
});

// EDIT USER NAME
router.post('/edit-username', isAuth, [
  check('firstName')
    .not().isEmpty().withMessage('please enter your first name')
    .isLength({ min: 3, max: 20 }).withMessage('first name must be between 3 and 20 characters')
    .not().matches(/\d/)
    .withMessage('first name can not contain a number'),
  check('lastName')
    .not().isEmpty().withMessage('please enter your last name')
    .isLength({ min: 3, max: 20 }).withMessage('last name must be between 3 and 20 characters')
    .not().matches(/\d/)
    .withMessage('last name can not contain a number')
], (req, res, next) => {
  const user = req.session.user;
  const errors = validationResult(req);
  if (! errors.isEmpty()) {
    var validationErrors = [];
    for(var i = 0; i < errors.errors.length; i++) {
      validationErrors.push(errors.errors[i].msg);
    }
    req.flash('changeUserNameError', validationErrors);
    res.redirect(`profile/${user._id}`);
    return;
  }
  const newUser = { firstName: req.body.firstName, lastName: req.body.lastName };
  User.updateOne({ _id: req.session.user._id }, { $set: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      req.flash('success', 'username changed successfully');
      res.redirect(`profile/${user._id}`);
    }
  });
});

// CHANGE EMAIL
router.post('/change-email', [
  check('email')
    .not().isEmpty().withMessage('please enter your email')
    .isEmail().withMessage('please enter a valid email'),
  ], isAuth, (req, res, next) => {
  const user = req.session.user;
  const errors = validationResult(req);
  if (! errors.isEmpty()) {
    var validationErrors = [];
    for(var i = 0; i < errors.errors.length; i++) {
      validationErrors.push(errors.errors[i].msg);
    }
    req.flash('changeEmailError', validationErrors);
    res.redirect(`profile/${user._id}`);
    return;
  }
  const newUser = { email: req.body.email };
  User.updateOne({ _id: req.session.user._id }, { $set: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      req.flash('success', 'email changed successfully');
      res.redirect(`profile/${user._id}`);
    }
  });
});

// CHANGE USER PASSWORD
router.post('/change-password', [
  check('currentPassword')
    .not().isEmpty().withMessage('please enter your current password'),
  check('newPassword')
    .not().isEmpty().withMessage('please enter the new password')
    .isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  check('confirmNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("passwrod and confirm passwrod doesn't match");
    }
    return true;
  })
], async(req, res, next) => {
  const user = req.session.user;
  const errors = validationResult(req);
  if (! errors.isEmpty()) {
    var validationErrors = [];
    for(var i = 0; i < errors.errors.length; i++) {
      validationErrors.push(errors.errors[i].msg);
    }
    req.flash('changePasswordError', validationErrors);
    res.redirect(`profile/${user._id}`);
    return;
  }
  const profile = await User.findOne({ email: user.email });
  const validate = await bcrypt.compare(req.body.currentPassword, profile.password);
  if (!validate) {
    req.flash('changePasswordError', 'current password is wrong');
    res.redirect(`profile/${user._id}`);
    return;
  }
  const newUser = { password: new User().hashPassword(req.body.newPassword) };
  User.updateOne({ _id: req.session.user._id }, {  $set: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      req.flash('success', 'password changed successfully');
      res.redirect(`profile/${user._id}`);
    }
  });
});

// SEND AND RECIEVE FRIEND REQUESTS
router.post('/request/:id', isAuth, async(req, res, next) => {
  const user = req.session.user;
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  const newUser = { sentRequests: { firstName: profile.firstName, lastName:profile.lastName, image: profile.profileImg, id: profile._id } };
  const newProfile = { friendRequests: { firstName: user.firstName, lastName:user.lastName, image: user.image, id: user._id } };
  User.updateOne({ _id: profileId }, { $push: newProfile }, (err, doc) => {
    if(err) {
      console.log(err);
    } else {
      return;
    }
  });
  User.updateOne({ _id: user._id }, { $push: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/users/profile/${profileId}`);
    }
  });
});

// CANCEL FRIEND REQUEST
router.post('/cancel/:id', isAuth, async(req, res) => {
  const user = req.session.user;
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  const newUser = { sentRequests: { firstName: profile.firstName, lastName:profile.lastName, image: profile.profileImg, id: profile._id } };
  const newProfile = { friendRequests: { firstName: user.firstName, lastName:user.lastName, image: user.image, id: user._id } };
  User.updateOne({ _id: profileId }, { $pull: newProfile }, (err, doc) => {
    if(err) {
      console.log(err);
    } else {
      return;
    }
  });
  User.updateOne({ _id: user._id }, { $pull: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/users/profile/${profileId}`);
    }
  });
});

// IGNORE FRIEND REQUEST
router.post('/ignore/:id', isAuth, async(req, res) => {
  const user = req.session.user;
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  const newUser = { friendRequests: { firstName: profile.firstName, lastName:profile.lastName, image: profile.profileImg, id: profile._id } };
  const newProfile = { sentRequests: { firstName: user.firstName, lastName:user.lastName, image: user.image, id: user._id } };
  User.updateOne({ _id: profileId }, { $pull: newProfile }, (err, doc) => {
    if(err) {
      console.log(err);
    } else {
      return;
    }
  });
  User.updateOne({ _id: user._id }, { $pull: newUser }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/users/profile/${profileId}`);
    }
  });
});

// ACCEPT FRIEND REQUEST
router.post('/accept/:id', isAuth, async(req, res) => {
  const user = req.session.user;
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  // USER INFORMATIONS OBJECT
  const userObj = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image
  };
  // PROFILE INFORMATIONS OBJECT
  const profileObj = {
    id: profile._id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    image: profile.profileImg
  };
  // REMOVE PROFILE FROM FRIEND REQUESTS
  User.updateOne({ _id: user._id }, { $pull: { friendRequests: profileObj } }, (err, doc) => {
    if(err) {
      console.log(err);
    } else {
      return;
    }
  });
  // ADD PROFILE TO FRIENDS ARRAY
  User.updateOne({ _id: user._id }, { $push: { friends: profileObj } }, (err, doc) => {
    if(err) {
      console.log(err);
    } else {
      return;
    }
  });
  // REMOVE USER FROM PROFILE SENT REQUESTS
  User.updateOne({ _id: profileId }, { $pull: { sentRequests: userObj } }, (err, doc) => {
    if(err) {
      console.log(err);
    } else {
      return;
    }
  });
  // ADD USER TO PROFILE FRIENDS ARRAY
  User.updateOne({ _id: profileId }, { $push: { friends: userObj } }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/users/profile/${profileId}`);
    }
  })
});

// REMOVE FRIEND
router.post('/remove/:id', isAuth, async(req, res) => {
  const user = req.session.user;
  const profileId = req.params.id;
  const profile = await User.findById(profileId);
  // USER INFORMATIONS OBJECT
  const userObj = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image
  };
  // PROFILE INFORMATIONS OBJECT
  const profileObj = {
    id: profile._id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    image: profile.profileImg
  };
  // REMOVE PROFILE FROM USER FRIENDS
  User.updateOne({ _id: user._id }, { $pull: { friends: profileObj } }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      return;
    }
  });
  // REMOVE USER FROM PROFILE FRIENDS
  User.updateOne({ _id: profileId }, { $pull: { friends: userObj } }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect(`/users/profile/${profileId}`);
    }
  });
});

// DELETE USER ACCOUNT
router.post('/delete-account', async(req, res, next) => {
  const user = req.session.user;
  const profile = await User.findById(user._id);
  const path = './public' + profile.profileImg;
  if (profile.profileImg !== '/images/default-user-image.png') {
    fs.unlink(path, (err) => {
      if (err) {
        console.log(err);
        return;
      }
    })
  }
  User.deleteOne({ _id: user._id }, (err, doc) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('logout');
    }
  });
});

module.exports = router;
