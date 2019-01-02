const env             = require("../src/utils/env");
const chai            = require("chai");
const chaiAsPromised  = require("chai-as-promised");
const rimraf          = require("rimraf");
const logger          = require("../src/utils/logger");

chai.use(chaiAsPromised);
chai.should();

logger.info("Setting up test environment");

env("test");

// only import the config after setting the environment
const config = require("../src/utils/config");
rimraf.sync(config.datastore.options.dataFolder + "/*");