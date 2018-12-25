const Q                = require("q");
const rest             = require("./rest");
const authentication   = require("./authentication");
const Resource         = require('./resource');
const _                = require('lodash');
const defaultConfig    = require('./utils/config');
const express          = require('express');
const stores           = require('./stores');
const { UserManager }  = require("./users");
const session          = require('./authentication/session');
const admin            = require('./admin');
const Schema           = require("./schema");
const {
    INTERNAL_ERROR
} = require('./utils/errors');


/**
 * Pocket main class
 *
 * @class Pocket
 */
class Pocket {

    constructor(config) {

        this.resources = {};

        // --- Configure
        this.configuration = _.extend({}, defaultConfig, config);

        // --- Setup database
        this.jsonStore = stores.createJsonStore(this);
        this.fileStore = stores.createFileStore(this);

        // --- Setup user manager
        this.users = new UserManager(this);

        this.initialization = Q.all([
            this.jsonStore.ready(),
            this.fileStore.ready(),
            this.users.ready()
        ]);

        const onShutdown = async () => {
            console.log('\nShutting down Pocket');
            await this.close();
            process.exit(0);
        }
        process.on('SIGTERM', onShutdown);
        process.on('SIGINT', onShutdown);
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
     * Sets up the routes
     *
     * @returns {Express} app an express app
     * @memberof CMS
     */
    middleware() {
        let app = express();

        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
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

        return app;
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
