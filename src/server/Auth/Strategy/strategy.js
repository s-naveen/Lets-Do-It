// Load modules.
const OAuth2Strategy = require('passport-oauth2');

const util = require('util');

const { InternalOAuthError } = require('passport-oauth2');

const Profile = require('./profile');
const APIError = require('./errors/apierror');

/**
 * `Strategy` constructor.
 *
 * The Zoho CRM authentication strategy authenticates requests by delegating to
 * Zoho CRM using the OAuth 2.0 protocol.
 *
 * Applications must supply a `Authorized redirect URL` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `cb`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `clientID`      your Zoho CRM application's Client ID
 *   - `clientSecret`  your Zoho CRM application's Client Secret
 *   - `redirect_URL`   URL to which Zoho CRM will redirect the user after granting authorization
 *   - `scope`         array of permission scopes to request.  valid scopes for the modules API include:
 *                     'ZohoCRM.modules.ALL', 'ZohoCRM.modules.read', 'ZohoCRM.modules.Leads', 'ZohoCRM.modules.salesorders', or none.
 *                     (see https://www.zoho.com/crm/help/api/v2/#Modules-APIs for more info)
 *   — `response_type` Specify response_type as "code"
 *                     (see http://developer.github.com/v3/#user-agent-required for more info)
 *   - `access_type`   Specify access_type as online or offline. If you want to generate the refresh token,
 *                     please set the value as "offline"
 *
 *
 * Examples:
 *
 *     passport.use(new ZohoCRMStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         redirect_URL: 'https://www.example.net/auth/zohocrm/callback',
 *         scope: 'ZohoCRM.modules.READ',
 *         response_type: 'code',
 *         access_type: 'offline'
 *       },
 *       function(accessToken, refreshToken, profile, cb) {
 *         User.findOrCreate(..., function (err, user) {
 *           cb(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'https://accounts.zoho.com/oauth/v2/auth';
  options.tokenURL = options.tokenURL || 'https://accounts.zoho.com/oauth/v2/token';
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {};

  if (!options.customHeaders.redirect_URL) {
    options.customHeaders.redirect_URL = options.redirect_URL || 'passport-zoho-crm';
  }

  if (!options.customHeaders.access_type) {
    options.customHeaders.access_type = options.access_type || 'passport-zoho-crm';
  }

  OAuth2Strategy.call(this, options, verify);
  this.name = 'zoho';
  this._userProfileURL = options.userProfileURL || 'https://accounts.zoho.com/oauth/user/info';
  this._oauth2.useAuthorizationHeaderforGET(true);

  const self = this;
  const _oauth2getOAuthAccessToken = this._oauth2.getOAuthAccessToken;
  this._oauth2.getOAuthAccessToken = function (code, params, callback) {
    _oauth2getOAuthAccessToken.call(
      self._oauth2,
      code,
      params,
      (err, accessToken, refreshToken, parameters) => {
        if (err) {
          return callback(err);
        }
        if (!accessToken) {
          return callback({
            statusCode: 400,
            data: JSON.stringify(parameters)
          });
        }
        callback(null, accessToken, refreshToken, parameters);
        return accessToken;
      }
    );
  };
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Zoho CRM.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `zoho-crm`
 *   - `id`               the user's Zoho ID
 *   - `displayName`      the user's full name
 *   - `emails`           the user's email addresses
 *
 * @param {string} accessToken
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function (accessToken, done) {
  const headers = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    orgId: '62437747'
  };

  this._oauth2._request('GET', this._userProfileURL, headers, '', accessToken, (err, body) => {
    let json;

    if (err) {
      if (err.data) {
        try {
          json = JSON.parse(err.data);
        } catch (_) {
          console.log(_);
        }
      }

      if (json && json.message) {
        return done(new APIError(json.message));
      }
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    const profile = Profile.parse(json);
    profile.provider = 'zoho';
    profile._raw = body;
    profile._json = json;
    done(null, profile);
  });
};

OAuth2Strategy.prototype.authorizationParams = function (options) {
  const opts = {};
  if (options.access_type) {
    opts.access_type = options.access_type;
  }
  return opts;
};

// Expose constructor.
module.exports = Strategy;
