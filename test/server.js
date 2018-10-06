import express  from "express"
import App      from "../src/App"
import _        from "lodash"
import http     from "http"

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

        App.newResource('posts', require('./samples/schemas/posts'));

        App.bootstrap(this.express);

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

export default new TestServer();