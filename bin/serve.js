require('babel-polyfill');
require('babel-register')({
    presets: [ 'env' ]
});

var express = require("express");
var log4js  = require("log4js");
var App     = require("../src/App").default;

let logger  = log4js.getLogger();
let server  = express();
let port    = 8000;

logger.level = 'info';

App.bootstrap(server);

server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
}); 