const path = require('path');
const dotenv = require('dotenv-safe');

// dotenv.load({
//   path: path.join(__dirname, '../../../.env'),
//   sample: path.join(__dirname, '../../../.env.sample')
// });

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongo: {
    uri: process.env.MONGO_URI
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  oauth: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  }
};
