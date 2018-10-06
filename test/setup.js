require('babel-polyfill');
require('babel-register')({
    presets: [ 'env' ]
});

var env             = require("../config/env");
var chai            = require("chai");
var chaiAsPromised  = require("chai-as-promised");
var rimraf          = require("rimraf");
var log4js          = require("log4js");
var logger          = log4js.getLogger();

chai.use(chaiAsPromised);
chai.should();

logger.level = 'info';
logger.info("Setting up test environment");

env("test");

// only import the config after setting the environment
const config = require("../config").default;
rimraf.sync(config.dataFolder + "/*");