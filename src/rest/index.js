const { Router }       = require("express");
const handlers         = require("./handlers");
const bodyParser       = require("body-parser");
const env              = require("../utils/env");
const config           = require("../utils/config");
const { 
    FORBIDDEN, 
    UNAUTHORIZED}       = require("../utils/errors");

const ACTION_MAP = {
    POST: 'create',
    GET: 'read',
    DELETE: 'remove',
    PUT: 'update'
};

module.exports = function (pocket) {
    let router = Router();
    
    const prefix = (endpoint) => `(/users/:userId)?${endpoint}`

    router.use(bodyParser.json());
    router.use('(/users/:userId)?/:resource', (req, res, next) => {
        const { resource } = req.params;

        req.pocket = pocket;

        if (env() === "test" && config.testing.disableAuthentication) {
            return next();
        }
        
        if (!req.user) {
            return UNAUTHORIZED.send(res);
        }

        if (pocket.users.isAdmin(req.user)) {
            return next();
        }

        const action = ACTION_MAP[req.method.toUpperCase()];
        const schema = pocket.schemaOf(resource);

        if (schema && schema.userIsAllowed(req.user, action)) {
            return next();
        }

        if (req.user.isAllowed(action, resource)) {
            return next();
        }

        return FORBIDDEN.send(res);
    })
    router.use(prefix("/:resource"), handlers.preloadResource);
    router.get(prefix("/:resource/:id/attachments/:attachmentId"), handlers.downloadAttachment);
    router.delete(prefix("/:resource/:id/attachments/:attachmentId"), handlers.deleteAttachment);
    router.get(prefix("/:resource/:id"), handlers.getOne);
    router.post(prefix("/:resource/:id/attachments"), handlers.attachFile);
    router.put(prefix("/:resource/:id"), handlers.updateOne);
    router.delete(prefix("/:resource/:id"), handlers.removeOne);
    router.get(prefix("/:resource"), handlers.getAll);
    router.post(prefix("/:resource"), handlers.createOne);
    
    return router;
};