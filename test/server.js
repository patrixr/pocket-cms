const express  = require("express");
const Pocket   = require("../src/pocket");
const _        = require("lodash");
const http     = require("http");

class TestServer {

    constructor() {
        this.server = null;
        this.express = null;
        this.port = _.random(20000, 21000);
    }

    run(cb) {
        if (this.server) {
            return cb();
        }

        this.express = express();

        this.pocket = new Pocket();

        this.pocket.resource('posts', require('./samples/schemas/posts'));

        this.express.use(this.pocket.middleware());
        this.server = http.createServer(this.express);
        this.server.listen(this.port, () => {
            console.log("\t Test server running on port " + this.port);
            cb();
        });
    }

    get baseUrl() {
        return `http://localhost:${this.port}`;
    }

    url(path) {
        return `${this.baseUrl}/${path}`;
    }

    close() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.express = null;
        }
    }

}

module.exports = new TestServer();