const mongoose = require('mongoose');
const ZohoStrategy = require('../auth/strategies/zohostrategy/strategy.js');
const { clientID, clientSecret, callbackURL } = require('../config/var').oauth;

const User = mongoose.model('User');
const zohoStrategy = new ZohoStrategy(
  {
    clientID,
    clientSecret,
    scope:
      'AaaServer.profile.Read Desk.tickets.READ Desk.contacts.READ Desk.tasks.READ Desk.basic.READ Desk.settings.READ Desk.events.READ',
    callbackURL,
    response_type: 'code',
    access_type: 'offline',
    grant_type: 'authorization_code',
    prompt: 'consent',
    userProfileURL: 'https://desk.zoho.com/api/v1/myinfo'
  },
  (accessToken, refreshToken, params, profile, done) => {
    const userJson = {
      user_id: profile._json.profileId,
      name: `${profile._json.firstName} ${profile._json.lastName}`,
      email: profile._json.emailId,
      access_token: accessToken,
      expires_on: new Date(new Date().getTime() + params.expires_in),
      refresh_token: refreshToken
    };
    User.findOrCreate(userJson, (user) => {
      done(null, user.user_id);
    });
  }
);

module.exports = zohoStrategy;
