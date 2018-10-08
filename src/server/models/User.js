const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

const { Long } = mongoose.Schema.Types;
const refresh = require('passport-oauth2-refresh');

const UserSchema = mongoose.Schema({
  user_id: Long,
  name: String,
  email: String,
  access_token: String,
  refresh_token: String,
  expires_on: Date
});

UserSchema.statics.findOrCreate = function (userJson, cb) {
  const User = this.model('User');
  User.findOne({ user_id: userJson.user_id })
    .then((user) => {
      if (user) {
        if (!user.refresh_token) {
          delete userJson.refresh_token;
        }
        return User.findOneAndUpdate({ _id: user._id }, userJson);
      }
      return new User(userJson).save();
    })
    .then(user => cb(user))
    .catch(err => console.log(err));
};

UserSchema.statics.getAccessToken = function (profileId, cb) {
  const User = this.model('User');
  User.findOne({ user_id: profileId })
    .then((user) => {
      if (new Date() > user.expires_on) {
        refresh.requestNewAccessToken('zoho', user.refresh_token, (err, accessToken) => {
          console.log(`token: ${accessToken}`);
          cb(accessToken);
        });
      }
      cb(user.access_token);
    })
    .catch((err) => {
      console.log(err);
      cb(null);
    });
};

mongoose.model('User', UserSchema);
