require('babel-polyfill');
require('babel-register')({
    presets: [ 'env' ]
});

var express = require("express");
var log4js  = require("log4js");
var CMS     = require("../src/CMS").default;

let logger  = log4js.getLogger();
let server  = express();
let port    = 8000;

logger.level = 'info';

CMS.bootstrap(server);

server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
}); 