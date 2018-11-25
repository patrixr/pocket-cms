const express = require("express");
const log4js  = require("log4js");
const Pocket  = require("../src/pocket");

let logger  = log4js.getLogger();
let server  = express();
let port    = 8000;

logger.level = 'info';

const pocket = new Pocket({
    datastore: {
        adapter: 'mongo',
        options: {
            dbName: 'pocket_dev',
            url: 'localhost:27017'
        }
    }
})

server.use(pocket.middleware());

server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
}); 