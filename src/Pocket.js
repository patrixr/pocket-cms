import rest             from "./rest"
import authentication   from "./authentication"
import { Resource }     from "./Resource";
import _                from "lodash"
import defaultConfig    from "./utils/config"
import express          from 'express';

/**
 * Pocket main class
 *
 * @class Pocket
 */
class Pocket {

    constructor(config) {
        // ---- Load schemas
        this.resources = {};
        this.config = defaultConfig;
    }

    /**
     * Sets the CMS configuration
     * 
     * @param {*} opts 
     * @memberof CMS
     */
    configure(opts) {
        _.extend(this.config, opts);
        return this;
    }

    /**
     * Create a new resource
     * 
     * @param {*} name 
     * @param {*} schema 
     * @memberof CMS
     */
    newResource(name, schema) {
        const resource = new Resource(name, schema);
        return this.registerResource(resource);
    }

    /**
     * Register a resource for api endpoint generation
     *
     * @param {*} resource
     * @memberof CMS
     */
    registerResource(resource) {
        if (this.resources[resource.name]) {
            throw `Resource with the name ${resource.name} already registered`;
        }
        this.resources[resource.name] = resource;
        return resource;
    }

    /**
     * Returns a registered resource
     * 
     * @param {*} name 
     * @memberof CMS
     */
    getResource(name) {
        return this.resources[name];
    }

    /**
     * Sets up the routes
     * 
     * @returns {Express} app an express app
     * @memberof CMS
     */
    build() {
        let app = express();

        // Adding users in for admin panel access
        app.use("/users", authentication());

        // Auto-generated rest api
        app.use("/rest", rest());

        return app;
    }

}

export default new Pocket();