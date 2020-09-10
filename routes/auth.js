const express = require('express')
const router = express.Router()
const passport = require('passport')
// @desc Auth with Google
// @route GET /auth/google

router.get('/google', passport.authenticate('google', {
  scope: ['profile']
}));

// @desc Google auth callback
// @route GET /auth/google/callback

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/courses');
  });

// @desc Logout
// @route GET /auth/logout

router.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

module.exports = router