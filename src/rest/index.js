import { Router }       from "express"
import * as handlers    from "./handlers"
import bodyParser       from "body-parser"
import env              from "../utils/env"
import config           from "../utils/config"
import { FORBIDDEN }    from "../utils/errors"
import User             from '../User'
import session          from "../authentication/session"


export default function () {
    let router = Router();
    
    const prefix = (endpoint) => `(/users/:userId)?${endpoint}`

    router.use(bodyParser.json());
    router.use(session);
    router.use('(/users/:userId)?/*', (req, res, next) => {

        if (env() === "test" && config.testing.disableAuthentication) {
            return next();
        }
        
        if (req.user && User.isAdmin(req.user)) {
            return next();
        }

        const userId = req.params.userId;
        if (userId && req.user && req.user.id === userId) {
            // A user can access his/her own data
            return next();
        }
        
        res.status(FORBIDDEN.code);
        res.json(FORBIDDEN);
    })
    router.use(prefix("/:resource"), handlers.preloadResource);
    router.get(prefix("/:resource/:id/attachments/:attachmentId"), handlers.downloadAttachment);
    router.delete(prefix("/:resource/:id/attachments/:attachmentId"), handlers.deleteAttachment);
    router.get(prefix("/:resource/:id"), handlers.getOne);
    router.post(prefix("/:resource/:id/attachments"), handlers.attachFile);
    router.post(prefix("/:resource/:id"), handlers.updateOne);
    router.delete(prefix("/:resource/:id"), handlers.removeOne);
    router.get(prefix("/:resource"), handlers.getAll);
    router.post(prefix("/:resource"), handlers.createOne);
    
    return router;
};