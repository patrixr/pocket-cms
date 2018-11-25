const env             = require("../src/utils/env");
const chai            = require("chai");
const chaiAsPromised  = require("chai-as-promised");
const rimraf          = require("rimraf");
const log4js          = require("log4js");
const logger          = log4js.getLogger();

chai.use(chaiAsPromised);
chai.should();

logger.level = 'info';
logger.info("Setting up test environment");

env("test");

// only import the config after setting the environment
const config = require("../src/utils/config");
rimraf.sync(config.datastore.options.dataFolder + "/*");