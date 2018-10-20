import { Router }       from "express"
import * as handlers    from "./handlers"
import bodyParser       from "body-parser"
import env              from "../utils/env"
import config           from "../utils/config"
import { 
    FORBIDDEN, 
    UNAUTHORIZED}       from "../utils/errors"

const ACTION_MAP = {
    POST: 'create',
    GET: 'read',
    DELETE: 'remove',
    PUT: 'update'
};

export default function (pocket) {
    let router = Router();
    
    const prefix = (endpoint) => `(/users/:userId)?${endpoint}`

    router.use(bodyParser.json());
    router.use('(/users/:userId)?/:resource', (req, res, next) => {

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

        const { resource } = req.params;
        const action       = ACTION_MAP[req.method.toUpperCase()];
        
        if (!req.user.isAllowed(action, resource)) {
            return FORBIDDEN.send(res);
        }

        next();
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