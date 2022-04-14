const isAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/users/login');
  }
}

const isNotAuth = (req, res, next) => {
  if (req.session.user) {
    res.redirect('/');
  } else {
    next();
  }
}

const isAdmin = (req, res, next) => {
  if (req.session.user) {
    if (req.session.user.isAdmin) {
      next();
    } else {
      res.render('404', { title: 'Chat', user: req.session.user });
    }
  } else {
    res.redirect('/admin/login');
  }
}

module.exports = {
  isAdmin: isAdmin,
  isNotAuth: isNotAuth,
  isAuth: isAuth,
}
