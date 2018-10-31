'use strict';

const path  = require('path');
const _     = require('lodash');
const fs    = require('fs');

const configDir = path.join(__dirname, '..', 'config');

let config = require(path.join(configDir, 'config.json'));
config.env = process.env.NODE_ENV;
config.root = path.join(__dirname, '..');

let envConfig = path.join(configDir, config.env + '.json')
if (fs.existsSync(envConfig)) {
  config = _.merge(config, require(envConfig));  
}

module.exports = config;
