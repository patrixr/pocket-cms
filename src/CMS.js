import rest             from "./rest"
import authentication   from "./authentication"
import { Resource }     from "./Resource";
import _                from "lodash"
import defaultConfig    from "./utils/config"

/**
 * CMS main class
 *
 * @class App
 */
class App {

    constructor(config) {
        // ---- Load schemas
        this.resources = {};
        this.config = defaultConfig;
    }

    /**
     * Sets the CMS configuration
     * 
     * @param {*} opts 
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
     */
    newResource(name, schema) {
        const resource = new Resource(name, schema);
        return this.registerResource(resource);
    }

    /**
     * Register a resource for api endpoint generation
     *
     * @param {*} resource
     * @memberof App
     */
    registerResource(resource) {
        if (this.resources[resource.name]) {
            throw `Resource with the name ${resource.name} already registered`;
        }
        this.resources[resource.name] = resource;
        return resource;
    }

    /**
     * 
     * 
     * @param {*} name 
     */
    getResource(name) {
        return this.resources[name];
    }

    /**
     * Sets up the routes
     * 
     * @returns {Express} app
     * @param {Express} app 
     */
    bootstrap(app) {

        // Adding users in for admin panel access
        app.use("/users", authentication());

        // Auto-generated rest api
        app.use("/ws", rest());

        return app;
    }

}

export default new App();