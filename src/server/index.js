/* eslint-disable no-global-assign */
Promise = require('bluebird');

const fs = require('fs');
const { join } = require('path');

/* eslint-disable global-require,import/no-dynamic-require,no-bitwise */
fs.readdirSync(join(__dirname, 'models'))
  .filter(file => file.search(~/^[^.].*\.js$/))
  .forEach(file => require(join(join(__dirname, 'models'), file)));

const { port, env } = require('./config/var');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

mongoose.connect();

app.listen(port, () => console.info(`server started on port ${port} (${env})`));

module.exports = app;
