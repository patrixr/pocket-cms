const Q                 = require("q");
const rest              = require("./rest");
const authentication    = require("./authentication");
const Resource          = require('./resource');
const _                 = require('lodash');
const defaultConfig     = require('./utils/config');
const express           = require('express');
const stores            = require('./stores');
const { UserManager }   = require("./users");
const session           = require('./authentication/session');
const admin             = require('./admin');
const Schema            = require("./schema");
const monitor           = require("./monitor");
const cron              = require("./utils/cron");
const EventEmitter      = require("events");
const logger            = require("./utils/logger");


/**
 * Pocket main class
 *
 * @class Pocket
 */
class Pocket extends EventEmitter {

    constructor(config) {
        super();

        this.logger = logger;

        this.resources = {};

        // --- Configure
        this.configuration = _.extend({}, defaultConfig, config);

        // --- Setup database
        this.jsonStore = stores.createJsonStore(this);
        this.fileStore = stores.createFileStore(this);

        // --- Cron
        this.cron = cron;

        // --- Setup user manager
        this.users = new UserManager(this);

        this.initialization = Q.all([
            this.jsonStore.ready(),
            this.fileStore.ready(),
            this.users.ready()
        ]);

        const onShutdown = async () => {
            console.log('\nShutting down Pocket');
            this.cron.stopAll();
            await this.close();
            process.exit(0);
        }
        process.on('SIGTERM', onShutdown);
        process.on('SIGINT', onShutdown);
    }


    static get Schema() {
        return Schema;
    }

    get Schema() {
        return Schema;
    }


    /**
     * Gets the CMS configuration
     *
     * @memberof CMS
     */
    config() {
        return this.configuration;
    }



    /**
     * Create or get a resource
     *
     * @param {*} name
     * @param {*} schema
     * @memberof CMS
     */
    resource(name, schema) {
        if (!schema) {
            return this.resources[name];
        }

        if (this.resources[name]) {
            throw `Resource with the name ${name} already registered`;
        }

        if (!(schema instanceof Schema)) {
            schema = new Schema(schema);
        }

        const resource = new Resource(name, schema, this);
        this.resources[resource.name] = resource;

        this.emit('newResource', resource);

        return resource;
    }

    /**
     * Returns the schema of a resource
     *
     * @param {*} resourceName
     * @returns
     * @memberof Pocket
     */
    schemaOf(resourceName) {
        const resource = this.resource(resourceName);
        return resource && resource.schema;
    }

    /**
     * Sets up the routes and returns the server
     *
     * @returns {Express} app an express app
     * @memberof CMS
     */
    server() {
        if (this.app) {
            return this.app;
        }

        let app = this.app = express();

        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            res.header("Access-Control-Expose-Headers", "Content-Length, X-Page, X-Per-Page, X-Total-Pages");
            res.header('Cache-Control', 'no-cache');
            next();
        });

        app.options("*", (req, res) => {
            res.status(200).send();
        });

        app.use(session(this));

        // Adding users in for admin panel access
        app.use("/users", authentication(this));

        // Auto-generated rest api
        app.use("/rest", rest(this));

        app.use("/admin", admin(this));

        app.use("/monitor", monitor(this));

        return app;
    }

    /**
     * Sets up the routes and returns the server
     *
     * @returns {Express} app an express app
     * @memberof CMS
     */
    middleware() {
        return this.server();
    }

    /**
     * Attach a plugin to Pocket
     *
     * @param {*} plugin
     * @memberof Pocket
     */
    use(name, plugin) {
        const middleware = plugin(this);
        if (middleware) {
            this.mount(`/plugins/${name}`, middleware);
        }
    }

    /**
     * Mount an express middleware
     *
     * @param {*} path
     * @param {*} router
     * @memberof Pocket
     */
    mount(path, router) {
        this.server().use(path, router);
    }

    /**
     * Returns a promise that resolves once Pocket has been initialised
     *
     * @returns
     * @memberof Pocket
     */
    ready() {
        return this.initialization;
    }


    /**
     * Closes database connections
     *
     * @memberof Pocket
     */
    async close() {
        await this.jsonStore.close();
        await this.fileStore.close();
    }
}

module.exports = Pocket;
