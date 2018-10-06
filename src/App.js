import requireDir       from "require-dir"
import chalk            from "chalk"
import rest             from "./rest"
import authentication   from "./authentication"
import { Resource }     from "./Resource";
import _                from "lodash"
import log4js           from "log4js"
import env              from "../config/env"
import path             from "path"
import express          from "express"

class App {

    constructor() {
        // ---- Setup Logging
        log4js.configure({
            appenders: { 
                console: { type: 'console' },
                app: { type: 'file', filename: 'logs/debug.log' } },
            categories: {
                default: { 
                    appenders: env() === "prod" ? ['app'] : ['console'],
                    level: 'info' }
            }
        })

        // ---- Load schemas
        const logger    = log4js.getLogger();
        const schemas   = requireDir("./schemas");
        this.resources  = _.mapValues(schemas, (schema, name) => {
            logger.info(`Loading resource ${chalk.cyanBright(name)}`);
            return new Resource(name, schema); 
        });
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
        const logger    = log4js.getLogger();
        const serve     = (folder) => {
            logger.info(`Serving ${folder}`);
            return express.static(path.join(__dirname, '..', folder));
        }
        const serveOne  = (file) => {
            logger.info(`Serving ${file}`);
            return (req, res) => res.sendFile(path.join(__dirname, '..', file))
        }

        // Adding users in for admin panel access
        app.use("/users", authentication());

        // Auto-generated rest api
        app.use("/ws", rest());

        // Static
        app.use('/dist',    serve('dist'));
        app.use('/admin',   serveOne('webapp/pages/admin.html'));
        app.use('/',        serveOne('webapp/pages/app.html'));

        return app;
    }

}

export default new App();