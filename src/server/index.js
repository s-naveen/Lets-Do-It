const express = require('express');
const os = require('os');
const passport = require('passport');
const ZohoStrategy = require('passport-zoho-crm').Strategy;
const cookieSession = require('cookie-session');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/LetsDoIt')
var db = mongoose.connection;
const app = express();
const fs = require('fs');
const join = require('path').join;
const axios = require('axios');
app.use(express.static('dist'));
var refresh = require('passport-oauth2-refresh');

fs.readdirSync(join(__dirname, 'models'))
    .filter(file => ~file.search(/^[^\.].*\.js$/))
    .forEach(file => require(join(join(__dirname, 'models'), file)));

const User = mongoose.model('User');

// cookieSession config
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // One day in milliseconds
    keys: ['randomstringhere']
}));


app.use(passport.initialize()); // Used to initialize passport
app.use(passport.session()); // Used to persist login sessions

// Middleware to check if the user is authenticated
function isUserAuthenticated(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.send('You must login!');
    }
}
var strategy = new ZohoStrategy({
    clientID: '1000.LZ5UT13NB6KK7599939VFLPMBHHETU',
    clientSecret: "b72b6fbf02525d313c9b51151ead1533cf6a1b80a4",
    scope: "AaaServer.profile.Read Desk.tickets.READ Desk.contacts.READ Desk.tasks.READ Desk.basic.READ Desk.settings.READ Desk.events.READ",
    callbackURL: 'http://localhost:8080/auth/zoho/callback',
    response_type: 'code',
    access_type: 'offline',
    grant_type: "authorization_code",
    prompt: 'consent',
    userProfileURL: "https://desk.zoho.com/api/v1/myinfo"
}, (accessToken, refreshToken, params, profile, done) => {
    let userJson = {
        user_id: profile._json.profileId,
        name: profile._json.firstName + " " + profile._json.lastName,
        email: profile._json.emailId,
        access_token: accessToken,
        expires_on: new Date(new Date().getTime() + params.expires_in),
        refresh_token: refreshToken
    };
    User.findOrCreate(userJson, user => {
        done(null, user.user_id);
    });
});

passport.use(strategy);
refresh.use(strategy);

// Used to stuff a piece of information into a cookie 
passport.serializeUser((user, done) => {
    done(null, user);
});

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
    done(null, user);
});


app.get('/oauth/zoho', passport.authenticate('zoho-crm', { access_type: 'offline' }));

app.get('/auth/zoho/callback',
    passport.authenticate('zoho-crm', { access_type: 'offline', failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/api/myinfo');
    });

app.get('/home', isUserAuthenticated, (req, res) => {
    res.send('You have reached the secret route');
});

app.get('/api/myinfo', (req, res) => {
    let profileId = req.user;
    User.getAccessToken(profileId, accessToken => {
        axios.get('https://desk.zoho.com/api/v1/myinfo', {
            'headers': {
                'Authorization': "Zoho-oauthtoken " + accessToken,
                'orgId': "62437747"
            }
        })
        .then(profile => {
            res.status(200).send(profile.data);
        })
        .catch(err => console.log(err));
    });
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log("connected");
});

app.listen(8080, () => console.log('Listening on port 8080!'));
