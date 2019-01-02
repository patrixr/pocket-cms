const express = require("express");
const Pocket  = require("../src/pocket");

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
    console.info(`Server running on port ${port}`);
});