var mongoose = require('mongoose');
require('mongoose-long')(mongoose);
var Long = mongoose.Schema.Types.Long;
var refresh = require('passport-oauth2-refresh');

var UserSchema = mongoose.Schema({
    user_id: Long,
    name: String,
    email: String,
    access_token: String,
    refresh_token: String,
    expires_on: Date,
});


UserSchema.statics.findOrCreate = function(userJson, cb) {
    let User = this.model('User');
    User.findOne({ user_id: userJson.user_id})
    .then(user => {
        if(user){
            if(!user.refresh_token) {
                delete userJson['refresh_token'];
            }
            return User.findOneAndUpdate({ _id: user._id} , userJson);
        } else {
            return new User(userJson).save();
        }
    })
    .then(user => cb(user))
    .catch(err => console.log(err));
}

UserSchema.statics.getAccessToken = function(profileId, cb) {
    let User = this.model('User');
    User.findOne({ user_id: profileId})
    .then(user => {
        if(new Date() > user.expires_on){
            return refresh.requestNewAccessToken('zoho-crm', user.refresh_token, function(err, accessToken) {
                console.log("token: " + accessToken);
               cb(accessToken);
            });
        } else {
            cb(user.access_token);
        }
    })
    .catch(err => {
        console.log(err);
        cb(null);
    });
}

mongoose.model('User', UserSchema);;
