const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const axios = require('axios');
const zohoStrategy = require('../auth/zohostrategy');

const User = mongoose.model('User');
const app = express();
app.use(bodyParser.json());
app.use(express.static('dist'));

app.use(
  cookieSession({
    maxAge: 60 * 24 * 60 * 60 * 1000,
    keys: ['secret']
  })
);

function isUserAuthenticated(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send('You must login!');
  }
}

app.use(passport.initialize());
app.use(passport.session());
passport.use(zohoStrategy);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/oauth/zoho', passport.authenticate('zoho', { access_type: 'offline' }));

app.get(
  '/auth/zoho/callback',
  passport.authenticate('zoho', { access_type: 'offline', failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/api/myinfo');
  }
);

app.get('/home', isUserAuthenticated, (req, res) => {
  res.send('You have reached the secret route');
});

app.get('/api/myinfo', (req, res) => {
  const profileId = req.user;
  User.getAccessToken(profileId, (accessToken) => {
    axios
      .get('https://desk.zoho.com/api/v1/myinfo', {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          orgId: '62437747'
        }
      })
      .then((profile) => {
        res.status(200).send(profile.data);
      })
      .catch(err => console.log(err));
  });
});

module.exports = app;
