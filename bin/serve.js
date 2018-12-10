var express = require("express");
var log4js  = require("log4js");
var Pocket  = require("../src/pocket");

let logger  = log4js.getLogger();
let server  = express();
let port    = 8000;

logger.level = 'info';

const pocket = new Pocket();

server.use(pocket.middleware());

server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});